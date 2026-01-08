from services.firebase_service import firebase_service
from datetime import datetime
import random


class MatchingService:
    @staticmethod
    def find_partner(uid, mode, limit=10):
        db = firebase_service.get_db()

        users_ref = db.collection("users")
        query = (
            users_ref.where("isOnline", "==", True)
            .where("isOccupied", "==", False)
            .where("currentMode", "==", mode)
            .limit(limit)
        )

        snapshot = query.get()

        potential = []
        for doc in snapshot:
            if doc.id != uid:
                user_data = doc.to_dict()
                user_data["uid"] = doc.id
                potential.append(user_data)

        if potential:
            return random.choice(potential)
        return None

    @staticmethod
    def create_session(uid1, uid2):
        db = firebase_service.get_db()
        session_id = (
            f"sess_{int(datetime.now().timestamp() * 1000)}_{random.randint(0, 999)}"
        )

        batch = db.batch()

        user1_ref = db.collection("users").document(uid1)
        user2_ref = db.collection("users").document(uid2)

        batch.update(
            user1_ref,
            {"partnerId": uid2, "isOccupied": True, "currentSessionId": session_id},
        )

        batch.update(
            user2_ref,
            {"partnerId": uid1, "isOccupied": True, "currentSessionId": session_id},
        )

        batch.commit()

        return session_id

    @staticmethod
    def end_session(uid, partner_id):
        db = firebase_service.get_db()

        batch = db.batch()

        user_ref = db.collection("users").document(uid)
        partner_ref = db.collection("users").document(partner_id)

        batch.update(
            user_ref, {"partnerId": None, "isOccupied": False, "isTyping": False}
        )

        batch.update(
            partner_ref, {"partnerId": None, "isOccupied": False, "isTyping": False}
        )

        batch.commit()

    @staticmethod
    def set_user_mode(uid, mode):
        db = firebase_service.get_db()
        user_ref = db.collection("users").document(uid)
        user_ref.update({"currentMode": mode, "isOccupied": False, "partnerId": None})


matching_service = MatchingService()
