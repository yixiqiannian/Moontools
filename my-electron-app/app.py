from flask import Flask, request, jsonify
from flask_cors import CORS
from inspect_engine import run_inspection
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload-devices', methods=['POST'])
def upload_devices():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    save_path = os.path.join(UPLOAD_FOLDER, 'devices.xlsx')
    file.save(save_path)
    return jsonify({'message': '设备文件上传成功'})

@app.route('/set-command-folder', methods=['POST'])
def set_command_folder():
    data = request.json
    folder_path = data.get('folder')
    if not folder_path or not os.path.exists(folder_path):
        return jsonify({'error': '命令文件夹不存在'}), 400

    with open(os.path.join(UPLOAD_FOLDER, 'command_folder.txt'), 'w') as f:
        f.write(folder_path)
    return jsonify({'message': '命令文件夹路径设置成功'})

@app.route('/set-output-folder', methods=['POST'])
def set_output_folder():
    data = request.json
    folder_path = data.get('folder')
    if not folder_path or not os.path.exists(folder_path):
        return jsonify({'error': '导出目录不存在'}), 400

    with open(os.path.join(UPLOAD_FOLDER, 'output_folder.txt'), 'w') as f:
        f.write(folder_path)
    return jsonify({'message': '导出目录设置成功'})

@app.route('/start-inspection', methods=['POST'])
def start_inspection():
    result = run_inspection()
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000)
