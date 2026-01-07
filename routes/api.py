from flask import Blueprint, jsonify, request, session
from services.matching_service import matching_service
from services.chat_service import chat_service
from services.webrtc_service import webrtc_service
from utils.decorators import auth_required
from utils.validators import Validators

validators = Validators()

api_bp = Blueprint("api", __name__)


@api_bp.route("/health")
def health():
    return jsonify({"status": "healthy", "message": "Waze Africa API is running"})


@api_bp.route("/online-count", methods=["GET"])
def online_count():
    from services.firebase_service import firebase_service

    db = firebase_service.get_db()
    snapshot = db.collection("users").where("isOnline", "==", True).get()
    return jsonify({"count": len(snapshot)})


@api_bp.route("/user/<uid>", methods=["GET"])
@auth_required
def get_user(uid):
    from services.firebase_service import firebase_service

    db = firebase_service.get_db()
    doc = db.collection("users").document(uid).get()

    if doc.exists:
        user_data = doc.to_dict()
        return jsonify({"status": "success", "data": user_data})

    return jsonify({"status": "error", "message": "User not found"}), 404


@api_bp.route("/match", methods=["POST"])
@auth_required
def match():
    data = request.get_json()
    uid = session.get("uid")
    mode = data.get("mode", "video")

    partner = matching_service.find_partner(uid, mode)

    if partner:
        session_id = matching_service.create_session(uid, partner["uid"])
        return jsonify(
            {
                "status": "success",
                "message": "Match found",
                "partner_id": partner["uid"],
                "session_id": session_id,
                "partner_name": partner.get("name"),
                "partner_country": partner.get("country"),
            }
        )

    return jsonify({"status": "pending", "message": "No partner available"})


@api_bp.route("/next", methods=["POST"])
@auth_required
def next_partner():
    uid = session.get("uid")
    data = request.get_json()
    partner_id = data.get("partner_id")

    if partner_id:
        matching_service.end_session(uid, partner_id)

    return jsonify({"status": "success", "message": "Session ended"})


@api_bp.route("/message", methods=["POST"])
@auth_required
def send_message():
    data = request.get_json()
    session_id = data.get("session_id")
    text = data.get("text")
    sender_id = session.get("uid")

    valid, msg = validators.validate_session_id(session_id)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    valid, msg = validators.validate_message(text)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    chat_service.send_message(session_id, sender_id, text)

    return jsonify({"status": "success", "message": "Message sent"})


@api_bp.route("/typing", methods=["POST"])
@auth_required
def set_typing():
    data = request.get_json()
    is_typing = data.get("is_typing", False)
    uid = session.get("uid")

    chat_service.set_typing_indicator(uid, is_typing)

    return jsonify({"status": "success"})


@api_bp.route("/call/offer", methods=["POST"])
@auth_required
def save_offer():
    data = request.get_json()
    session_id = data.get("session_id")
    offer_data = data.get("offer")

    valid, msg = validators.validate_session_id(session_id)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    valid, msg = validators.validate_webrtc_data(offer_data)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    webrtc_service.save_offer(session_id, offer_data)

    return jsonify({"status": "success"})


@api_bp.route("/call/answer", methods=["POST"])
@auth_required
def save_answer():
    data = request.get_json()
    session_id = data.get("session_id")
    answer_data = data.get("answer")

    valid, msg = validators.validate_session_id(session_id)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    valid, msg = validators.validate_webrtc_data(answer_data)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    webrtc_service.save_answer(session_id, answer_data)

    return jsonify({"status": "success"})


@api_bp.route("/call/candidate", methods=["POST"])
@auth_required
def save_ice_candidate():
    data = request.get_json()
    session_id = data.get("session_id")
    candidate_type = data.get("type")
    candidate_data = data.get("candidate")

    valid, msg = validators.validate_session_id(session_id)
    if not valid:
        return jsonify({"status": "error", "message": msg}), 400

    if candidate_type not in ["offer", "answer"]:
        return jsonify({"status": "error", "message": "Invalid candidate type"}), 400

    if not candidate_data:
        return jsonify({"status": "error", "message": "Missing candidate data"}), 400

    webrtc_service.save_ice_candidate(session_id, candidate_type, candidate_data)

    return jsonify({"status": "success"})
