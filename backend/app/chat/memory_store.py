from langchain.memory import ConversationBufferMemory

_memory_dict = {}

def get_memory(report_id):
    if report_id not in _memory_dict:
        _memory_dict[report_id] = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    return _memory_dict[report_id] 