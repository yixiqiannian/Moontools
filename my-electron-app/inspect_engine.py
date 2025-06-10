import os
import sys
import json
import pandas as pd
from datetime import datetime
from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException, ConnectionException
import concurrent.futures
import re

# 定义最大并发连接数
# MAX_WORKERS 应该从外部传入，这里保留一个默认值，但实际运行通过参数传递
MAX_WORKERS = 5 

def print_status(ip, brand, status, **kwargs): # 增加 **kwargs 参数
    """
    Prints the inspection status of a device or overall summary in JSON format to stdout.
    """
    data = {
        "ip": ip,
        "brand": brand,
        "status": status
    }
    data.update(kwargs) # 合并额外的关键字参数
    print(json.dumps(data), flush=True)

def inspect_single_device(device_info, command_folder, output_folder):
    """
    Performs inspection for a single network device and returns its outcome.
    """
    ip = str(device_info.get("ip")).strip()
    brand = str(device_info.get("brand")).strip().lower()
    username = str(device_info.get("username")).strip()
    password = str(device_info.get("password")).strip()

    print_status(ip, brand, "巡检中")

    device_type = ""
    if brand == "cisco":
        device_type = "cisco_ios"
    elif brand == "huawei":
        device_type = "huawei"
    elif brand == "h3c":
        device_type = "hp_comware"
    else:
        status_message = f"巡检失败（不支持的厂商: {brand}）"
        print_status(ip, brand, status_message, reason=status_message) # 增加 reason
        return {"ip": ip, "brand": brand, "status": "failed", "reason": status_message}

    try:
        device = {
            "device_type": device_type,
            "host": ip,
            "username": username,
            "password": password,
            "secret": "",
            "port": 22,
            "timeout": 10
        }
        conn = ConnectHandler(**device)

        command_path = os.path.join(command_folder, f"{brand}.txt")
        if not os.path.exists(command_path):
            status_message = "巡检失败（无命令文件）"
            print_status(ip, brand, status_message, reason=status_message)
            conn.disconnect()
            return {"ip": ip, "brand": brand, "status": "failed", "reason": status_message}

        with open(command_path, encoding="utf-8") as f:
            commands = [line.strip() for line in f if line.strip()]

        results = ""
        for cmd in commands:
            output = conn.send_command(cmd)
            results += f"> {cmd}\n{output}\n\n"

        conn.disconnect()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_file = os.path.join(output_folder, f"{ip}_{timestamp}.txt")
        with open(out_file, "w", encoding="utf-8") as out:
            out.write(results)

        print_status(ip, brand, "巡检完毕", output_file=out_file) # 传递 output_file
        return {"ip": ip, "brand": brand, "status": "completed", "reason": "巡检完毕", "output_file": out_file} # 使用 'completed'

    except NetmikoTimeoutException:
        status_message = "登录失败（连接超时）"
        print_status(ip, brand, status_message, reason=status_message)
        return {"ip": ip, "brand": brand, "status": "failed", "reason": status_message}
    except NetmikoAuthenticationException:
        status_message = "登录失败（认证失败）"
        print_status(ip, brand, status_message, reason=status_message)
        return {"ip": ip, "brand": brand, "status": "failed", "reason": status_message}
    except ConnectionException as e:
        status_message = f"登录失败（连接错误: {e}）"
        print_status(ip, brand, status_message, reason=status_message)
        return {"ip": ip, "brand": brand, "status": "failed", "reason": status_message}
    except Exception as e:
        status_message = f"巡检失败（未知错误: {e}）"
        print_status(ip, brand, status_message, reason=status_message)
        return {"ip": ip, "brand": brand, "status": "failed", "reason": status_message}

def run_inspection(devices_file, command_folder, output_folder, max_workers=MAX_WORKERS):
    """
    Manages the concurrent inspection of network devices and generates summary reports.
    """
    df = pd.read_excel(devices_file)
    os.makedirs(output_folder, exist_ok=True)

    all_results = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # 使用 iterrows() 迭代 DataFrame 的每一行
        futures = {executor.submit(inspect_single_device, row.to_dict(), command_folder, output_folder): row for _, row in df.iterrows()}

        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                all_results.append(result)
            except Exception as exc:
                device_row = futures[future]
                ip = str(device_row.get("ip", "unknown"))
                brand = str(device_row.get("brand", "unknown")).strip().lower()
                status_message = f"任务处理异常（外部捕获: {exc}）"
                print_status(ip, brand, status_message, reason=status_message)
                all_results.append({"ip": ip, "brand": brand, "status": "failed", "reason": status_message})

    successful_devices = [res for res in all_results if res["status"] in ["completed", "success"]]
    failed_devices = [res for res in all_results if res["status"] == "failed"]

    current_run_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 生成失败设备汇总文件
    failed_summary_file = os.path.join(output_folder, f"failed_summary_{current_run_timestamp}.txt")
    with open(failed_summary_file, "w", encoding="utf-8") as f_failed:
        f_failed.write(f"--- 巡检失败设备统计 ({len(failed_devices)} 台) ---\n\n")
        if not failed_devices:
            f_failed.write("无失败设备。\n")
        else:
            for i, dev in enumerate(failed_devices):
                f_failed.write(f"{i+1}. IP: {dev['ip']}, 品牌: {dev['brand']}, 失败原因: {dev['reason']}\n")
        f_failed.write("\n------------------------------------------------\n")
    print_status("Summary", "System", f"失败汇总文件已生成: {failed_summary_file}")

    # 生成成功设备汇总文件
    successful_summary_file = os.path.join(output_folder, f"successful_summary_{current_run_timestamp}.txt")
    with open(successful_summary_file, "w", encoding="utf-8") as f_success:
        f_success.write(f"--- 巡检成功设备统计 ({len(successful_devices)} 台) ---\n\n")
        if not successful_devices:
            f_success.write("无成功设备。\n")
        else:
            for i, dev in enumerate(successful_devices):
                f_success.write(f"{i+1}. IP: {dev['ip']}, 品牌: {dev['brand']}\n")
        f_success.write("\n------------------------------------------------\n")
    print_status("Summary", "System", f"成功汇总文件已生成: {successful_summary_file}")

    # --- 生成每日累计汇总文件 (在脚本所在目录的 'summary' 子目录中) ---
    # script_dir = os.path.dirname(os.path.abspath(__file__))
    script_dir = os.getcwd()
    daily_summary_root_dir = os.path.join(script_dir, "summary")
    os.makedirs(daily_summary_root_dir, exist_ok=True)

    today_date_str = datetime.now().strftime("%Y-%m-%d")
    daily_summary_file_path = os.path.join(daily_summary_root_dir, f"{today_date_str}.txt")
    
    current_run_success = len(successful_devices)
    current_run_failed = len(failed_devices)

    cumulative_success_today = 0
    cumulative_failed_today = 0

    if os.path.exists(daily_summary_file_path):
        try:
            with open(daily_summary_file_path, "r", encoding="utf-8") as f_daily_read:
                content = f_daily_read.read()
                # 尝试从文件中匹配总计数量
                match = re.search(r'成功总计: (\d+)台, 失败总计: (\d+)台$', content.strip())
                if match:
                    cumulative_success_today = int(match.group(1))
                    cumulative_failed_today = int(match.group(2))
                else:
                    print_status("Summary", "Daily", f"警告: 每日汇总文件格式异常，将重新开始累计。文件: {daily_summary_file_path}")
        except Exception as e:
            print_status("Summary", "Daily", f"读取每日汇总文件失败: {e}", error=str(e))
            cumulative_success_today = 0
            cumulative_failed_today = 0

    cumulative_success_today += current_run_success
    cumulative_failed_today += current_run_failed

    daily_record_line_cumulative = (
        f"日期: {today_date_str}, 成功总计: {cumulative_success_today}台, "
        f"失败总计: {cumulative_failed_today}台\n"
    )

    try:
        with open(daily_summary_file_path, "w", encoding="utf-8") as f_daily_write:
            f_daily_write.write(daily_record_line_cumulative)
        print_status("Summary", "Daily", f"每日累计汇总文件更新: {daily_summary_file_path}")
    except Exception as e:
        print_status("Summary", "Daily", f"写入每日累计汇总文件失败: {e}", error=str(e))

    # --- 通过 print_status 发送每日累计统计给前端 ---
    print_status(
        "Summary",
        "DailyCumulative", # 独特的 status 标识符
        "daily_cumulative_summary",
        success_total=cumulative_success_today,
        failed_total=cumulative_failed_today,
        timestamp=datetime.now().strftime("%Y%m%d_%H%M%S")
    )
   

    print_status("Summary", "System", "所有巡检任务和汇总文件生成完毕。")
    # 将所有巡检结果发送给前端用于最终展示
    


    
   


if __name__ == "__main__":
    if len(sys.argv) < 4: # 调整为小于4，因为 max_workers 可能是第4个可选参数
        print("Usage: python inspect_engine.py <devices_excel_path> <command_folder_path> <output_folder_path> [max_workers]")
        sys.exit(1)

    excel_path = sys.argv[1]
    command_dir = sys.argv[2]
    export_dir = sys.argv[3]
    
    # 尝试获取 max_workers，如果未提供则使用默认值
    try:
        workers = int(sys.argv[4]) if len(sys.argv) > 4 else MAX_WORKERS
    except ValueError:
        print("Error: max_workers must be an integer. Using default value.")
        workers = MAX_WORKERS

    run_inspection(excel_path, command_dir, export_dir, max_workers=workers)
    





