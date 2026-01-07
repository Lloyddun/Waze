from services.firebase_service import firebase_service
from datetime import datetime
from firebase_admin import firestore


class ChatService:
    @staticmethod
    def send_message(session_id, sender_id, text):
        db = firebase_service.get_db()
        messages_ref = (
            db.collection("calls").document(session_id).collection("messages")
        )

        message_data = {
            "text": text,
            "senderId": sender_id,
            "timestamp": firestore.SERVER_TIMESTAMP,
        }

        messages_ref.add(message_data)

    @staticmethod
    def get_session_messages(session_id):
        db = firebase_service.get_db()
        messages_ref = (
            db.collection("calls").document(session_id).collection("messages")
        )

        snapshot = messages_ref.order_by("timestamp").stream()
        messages = []

        for doc in snapshot:
            message = doc.to_dict()
            messages.append(message)

        return messages

    @staticmethod
    def set_typing_indicator(uid, is_typing):
        db = firebase_service.get_db()
        user_ref = db.collection("users").document(uid)
        user_ref.update({"isTyping": is_typing})


chat_service = ChatService()
