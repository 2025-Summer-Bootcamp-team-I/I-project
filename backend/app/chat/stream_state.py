# app/chat/stream_state.py

# 현재 스트리밍 중인 chat_id들을 추적하는 집합
_active_streams: set[int] = set()

def is_streaming(chat_id: int) -> bool:
    """
    현재 chat_id가 스트리밍 중인지 확인합니다.
    """
    return chat_id in _active_streams

def mark_stream_start(chat_id: int) -> None:
    """
    해당 chat_id의 스트리밍을 시작으로 표시합니다.
    """
    _active_streams.add(chat_id)

def mark_stream_end(chat_id: int) -> None:
    """
    해당 chat_id의 스트리밍을 종료로 표시합니다.
    """
    _active_streams.discard(chat_id)
