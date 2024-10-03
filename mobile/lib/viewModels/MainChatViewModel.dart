import 'dart:async';
import 'package:flutter/cupertino.dart';
import '../models/Chat.dart';
import '../services/ChatService.dart';

class MainChatViewModel extends ChangeNotifier {
  final ChatService _chatService = ChatService();
  final List<ChatMessage> _chatMessages = [];
  late Chat _currentChat;

  List<ChatMessage> get chatMessages => _chatMessages;

  void sendPrompt(String question, int currentChatId) async {
    ChatMessage chatMessage = ChatMessage(question: question);
    _chatMessages.add(chatMessage);
    notifyListeners();

    await for (var answer in _chatService.postQuestion(question, currentChatId)) {
      chatMessage.addResponse(answer);
    }

    chatMessage.finalizeResponse();
    notifyListeners();
  }

  Future<List<Chat>> getChatList(int userId) async{

      List<Chat> chatList = await _chatService.getChatList(userId);
      return chatList;
  }


}

class ChatMessage {
  final String question;
  String response = '';
  final StreamController<String> _responseController = StreamController<String>.broadcast();

  ChatMessage({required this.question});

  Stream<String> get responseStream => _responseController.stream;

  void addResponse(String response) {
    this.response += response;
    _responseController.sink.add(this.response);
  }

  void finalizeResponse() {
    _responseController.sink.add(this.response);
  }

  void dispose() {
    _responseController.close();
  }
}
