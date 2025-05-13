"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint, Response, current_app, send_from_directory
from api.models import db, User, ALPRRecord, Camera
from api.utils import generate_sitemap, APIException, role_required
from flask_cors import CORS
from flask_jwt_extended import jwt_required, create_access_token
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os
import subprocess


api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/alpr-records', methods=['POST'])
def receive_alpr():
    data = request.get_json()
    camera_id = data.get('id')

    camera = Camera.query.get(camera_id)
    if not camera:
        return jsonify({"error": "Cámara no encontrada"}), 404

    record = ALPRRecord(
        camera_id=camera_id,
        plate_number=data.get('plate'),
        detected_at=data.get('date'),
        image_url=data.get('image'),
        country=data.get('country'),
        confidence=data.get('confidence'),
        left_pos=data.get('left'),
        top_pos=data.get('top'),
        right_pos=data.get('right'),
        bottom_pos=data.get('bottom'),
        char_height=data.get('charheight'),
        processing_time=data.get('processingtime'),
        multiplate=data.get('multiplate'),
        direction=data.get('direction'),
        vehicle_type=data.get('vehicleType'),
        vehicle_color=data.get('vehicleColor'),
        vehicle_model=data.get('vehicleModel'),
        vehicle_make=data.get('vehicleMake')
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({"message": "Registro guardado"}), 201


@api.route('/alpr-records', methods=['GET'])
def get_alpr():
    query = db.session.query(ALPRRecord, Camera).join(Camera)

    plate = request.args.get('plate')
    camera = request.args.get('camera')
    vehicle_type = request.args.get('vehicleType')
    vehicle_make = request.args.get('vehicleMake')
    vehicle_model = request.args.get('vehicleModel')
    start_date = request.args.get('startDate')
    start_time = request.args.get('startTime')
    end_date = request.args.get('endDate')
    end_time = request.args.get('endTime')

    if plate:
        query = query.filter(ALPRRecord.plate_number.ilike(f"%{plate}%"))
    if camera:
        query = query.filter(Camera.name == camera)
    if vehicle_type:
        query = query.filter(ALPRRecord.vehicle_type == vehicle_type)
    if vehicle_make:
        query = query.filter(ALPRRecord.vehicle_make == vehicle_make)
    if vehicle_model:
        query = query.filter(ALPRRecord.vehicle_model == vehicle_model)

    try:
        if start_date:
            start_dt_str = f"{start_date} {start_time or '00:00'}"
            start_dt = datetime.strptime(start_dt_str, "%Y-%m-%d %H:%M")
            query = query.filter(ALPRRecord.detected_at >= start_dt)
        if end_date:
            end_dt_str = f"{end_date} {end_time or '23:59'}"
            end_dt = datetime.strptime(end_dt_str, "%Y-%m-%d %H:%M")
            query = query.filter(ALPRRecord.detected_at <= end_dt)
    except ValueError:
        return jsonify({"error": "Formato de fecha/hora inválido. Usa YYYY-MM-DD para fecha y HH:MM para hora."}), 400

    query = query.order_by(ALPRRecord.detected_at.desc())

    records = query.all()

    result = []
    for record, camera in records:
        result.append({
            'id': record.id,
            'camera_id': record.camera_id,
            'camera_name': camera.name,
            'plate_number': record.plate_number,
            'detected_at': record.detected_at.strftime('%d/%m/%Y %H:%M:%S') if record.detected_at else None,
            'confidence': float(record.confidence) if record.confidence else None,
            'direction': record.direction,
            'vehicle_type': record.vehicle_type,
            'vehicle_color': record.vehicle_color,
            'vehicle_model': record.vehicle_model,
            'vehicle_make': record.vehicle_make,
            'country': record.country
        })

    return jsonify(result)


@api.route('/alpr-records/<int:record_id>', methods=['GET'])
def get_alpr_record(record_id):
    record = ALPRRecord.query.get(record_id)
    if not record:
        return jsonify({"error": "Registro no encontrado"}), 404

    camera = Camera.query.get(record.camera_id)
    
    result = {
        'id': record.id,
        'camera_id': record.camera_id,
        'camera_name': camera.name if camera else None,
        'plate_number': record.plate_number,
        'detected_at': record.detected_at.strftime('%d/%m/%Y %H:%M:%S') if record.detected_at else None,
        'image_url': record.image_url,
        'confidence': float(record.confidence) if record.confidence else None,
        'direction': record.direction,
        'vehicle_type': record.vehicle_type,
        'vehicle_color': record.vehicle_color,
        'vehicle_model': record.vehicle_model,
        'vehicle_make': record.vehicle_make,
        'country': record.country
    }

    return jsonify(result)

@api.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'operator') 

        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "El usuario ya existe"}), 400

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, password_hash=hashed_password, role=role)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"msg": "Usuario registrado correctamente"}), 201

    except Exception as e:
        print('Error en registro:', e)
        return jsonify({"error": str(e)}), 500

@api.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print('Received login data:', data)

        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        print('Queried user:', user)

        if user:
            print('User password hash:', user.password_hash)
            password_matches = check_password_hash(user.password_hash, password)
            print('Password match result:', password_matches)
        else:
            print('User not found in database.')

        if user and password_matches:
            access_token = create_access_token(identity={'id': user.id, 'role': user.role})
            print('Login successful, returning token.')
            return jsonify(access_token=access_token, user={'id': user.id, 'username': user.username, 'role': user.role}), 200

        print('Login failed: bad username or password.')
        return jsonify({"msg": "Bad username or password"}), 401

    except Exception as e:
        print('Internal error during login:', e)
        return jsonify({"error": str(e)}), 500

@api.route('/cameras', methods=['POST'])
@jwt_required()
@role_required('admin')
def add_camera():
    data = request.get_json()
    logger.debug(f"POST /cameras payload: {data}")
    required_fields = ['name', 'ip_address', 'connection_method']
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            return jsonify({"error": f"Falta el campo requerido: {field}"}), 400

    try:
        new_camera = Camera(
            name=data['name'],
            ip_address=data['ip_address'],
            username=data.get('username'),
            password=data.get('password'),
            connection_method=data['connection_method'],
            location_lat=float(data['location_lat']) if data.get('location_lat') not in [None, '', 'null'] else None,
            location_lng=float(data['location_lng']) if data.get('location_lng') not in [None, '', 'null'] else None,
            is_active=bool(data.get('is_active')) if data.get('is_active') is not None else True,
            municipio=data.get('municipio')
        )
        db.session.add(new_camera)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error al agregar cámara: {e}")
        return jsonify({"error": f"Error al agregar cámara: {str(e)}"}), 422

    return jsonify({"message": "Cámara añadida correctamente", "camera": serialize_camera(new_camera)}), 201


@api.route('/cameras', methods=['GET'])
def get_cameras():
    cameras = Camera.query.all()
    logger.debug(f"GET /cameras returned {len(cameras)} cameras")
    return jsonify([serialize_camera(cam) for cam in cameras]), 200


@api.route('/cameras/<int:camera_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_camera(camera_id):
    data = request.get_json()
    logger.debug(f"PUT /cameras/{camera_id} payload: {data}")
    camera = Camera.query.get(camera_id)
    if not camera:
        logger.error(f"Camera ID {camera_id} not found")
        return jsonify({"error": "Cámara no encontrada"}), 404

    try:
        camera.name = data.get('name', camera.name)
        camera.ip_address = data.get('ip_address', camera.ip_address)
        camera.username = data.get('username', camera.username)
        camera.password = data.get('password', camera.password)
        camera.connection_method = data.get('connection_method', camera.connection_method)

        if 'location_lat' in data:
            camera.location_lat = float(data['location_lat']) if data['location_lat'] not in [None, '', 'null'] else None
        if 'location_lng' in data:
            camera.location_lng = float(data['location_lng']) if data['location_lng'] not in [None, '', 'null'] else None
        if 'is_active' in data:
            camera.is_active = bool(data['is_active'])
        if 'municipio' in data:
            camera.municipio = data['municipio']

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error al actualizar cámara {camera_id}: {e}")
        return jsonify({"error": f"Error al actualizar cámara: {str(e)}"}), 422

    return jsonify({"message": "Cámara actualizada correctamente", "camera": serialize_camera(camera)}), 200


@api.route('/cameras/<int:camera_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_camera(camera_id):
    logger.debug(f"DELETE /cameras/{camera_id}")
    camera = Camera.query.get(camera_id)
    if not camera:
        logger.error(f"Camera ID {camera_id} not found for delete")
        return jsonify({"error": "Cámara no encontrada"}), 404

    try:
        db.session.delete(camera)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error al eliminar cámara {camera_id}: {e}")
        return jsonify({"error": f"Error al eliminar cámara: {str(e)}"}), 422

    return jsonify({"message": "Cámara eliminada correctamente"}), 200


def serialize_camera(cam):
    return {
        'id': cam.id,
        'name': cam.name,
        'municipio': cam.municipio or '',
        'ip_address': cam.ip_address,
        'username': cam.username,
        'connection_method': cam.connection_method,
        'location': {
            'lat': str(cam.location_lat) if cam.location_lat else None,
            'lng': str(cam.location_lng) if cam.location_lng else None
        },
        'is_active': cam.is_active
    }


def start_hls_for_camera(camera):
    hls_folder = current_app.config['HLS_FOLDER']
    cam_dir = os.path.join(hls_folder, str(camera.id))
    os.makedirs(cam_dir, exist_ok=True)
    playlist = os.path.join(cam_dir, 'index.m3u8')

  
    if not os.path.exists(playlist):
        rtsp_url = (
            f"rtsp://{camera.username}:"
            f"{camera.password}@{camera.ip_address}/axis-media/media.amp"
        )
        cmd = [
            'ffmpeg',
            '-rtsp_transport', 'tcp',
            '-re',
            '-i', rtsp_url,
            '-c:v', 'copy',
            '-an',
            '-f', 'hls',
            '-hls_time', '2',
            '-hls_list_size', '3',
            '-hls_flags', 'delete_segments+omit_endlist',
            '-hls_allow_cache', '0',
            '-hls_segment_filename', os.path.join(cam_dir, 'segment_%03d.ts'),
            playlist
        ]
        subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return cam_dir


@api.route('/hls/<int:camera_id>/<path:filename>')
def serve_hls(camera_id, filename):
    camera = Camera.query.get(camera_id)
    if not camera:
        return jsonify({"error": "Cámara no encontrada"}), 404

    cam_dir = start_hls_for_camera(camera)
    return send_from_directory(cam_dir, filename)


@api.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    result = [{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': u.role
    } for u in users]
    return jsonify(result), 200


@api.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'operator'),
        password_hash=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "Usuario creado", "id": new_user.id}), 201


@api.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    user.username = data['username']
    user.email = data['email']
    user.role = data['role']
    db.session.commit()
    return jsonify({"msg": "Usuario actualizado"}), 200


@api.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "Usuario eliminado"}), 200
