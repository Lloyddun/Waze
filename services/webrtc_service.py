from services.firebase_service import firebase_service


class WebRTCService:
    @staticmethod
    def save_offer(session_id, offer_data):
        db = firebase_service.get_db()
        call_ref = db.collection("calls").document(session_id)

        call_ref.set({"offer": offer_data, "answer": None})

    @staticmethod
    def save_answer(session_id, answer_data):
        db = firebase_service.get_db()
        call_ref = db.collection("calls").document(session_id)

        call_ref.update({"answer": answer_data})

    @staticmethod
    def save_ice_candidate(session_id, candidate_type, candidate_data):
        db = firebase_service.get_db()
        collection_name = (
            "offerCandidates" if candidate_type == "offer" else "answerCandidates"
        )
        candidates_ref = (
            db.collection("calls").document(session_id).collection(collection_name)
        )

        candidates_ref.add(candidate_data)

    @staticmethod
    def get_call_data(session_id):
        db = firebase_service.get_db()
        call_ref = db.collection("calls").document(session_id)
        doc = call_ref.get()

        if doc.exists:
            return doc.to_dict()
        return None

    @staticmethod
    def get_candidates(session_id, candidate_type):
        db = firebase_service.get_db()
        collection_name = (
            "offerCandidates" if candidate_type == "offer" else "answerCandidates"
        )
        candidates_ref = (
            db.collection("calls").document(session_id).collection(collection_name)
        )

        snapshot = candidates_ref.stream()
        candidates = []

        for doc in snapshot:
            candidates.append(doc.to_dict())

        return candidates


webrtc_service = WebRTCService()
