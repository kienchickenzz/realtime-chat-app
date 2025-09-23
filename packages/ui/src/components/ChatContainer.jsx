import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        getConversationMessages,
        isMessagesLoading,
        selectedUser,
        subscribeToMessages,
        unsubscribeFromMessages,
    } = useChatStore();
    const { authUser } = useAuthStore();
    
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (selectedUser?.id) {
            // Check if selectedUser is a conversation (has members) or a user
            if (selectedUser.members) {
                // It's a conversation
                getConversationMessages(selectedUser.id);
            } else {
                // It's a direct user (fallback to old API)
                getMessages(selectedUser._id);
            }
        }

        subscribeToMessages();

        return () => unsubscribeFromMessages();
    }, [selectedUser?.id, getMessages, getConversationMessages, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
                <div ref={messageEndRef} />   {/* anchor để scroll */}

                {messages.map((message) => {
                    // Handle both old format (_id, text) and new format (id, content)
                    const messageId = message.id;
                    const messageContent = message.content;
                    const senderId = message.sender?.id;
                    const senderInfo = message.sender || {};
                    
                    return (
                        <div
                            key={messageId}
                            className={`chat ${senderId === authUser.id ? "chat-end" : "chat-start"}`}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={
                                            senderId === authUser.id
                                                ? authUser.profilePic || "/avatar.png"
                                                : senderInfo.avatarUrl || selectedUser.profilePic || "/avatar.png"
                                        }
                                        alt="profile pic"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                <span className="text-xs opacity-70 ml-1">
                                    {senderId === authUser.id ? "You" : (senderInfo.displayName || selectedUser.fullName)}
                                </span>
                                <time className="text-xs opacity-50 ml-1">
                                    {formatMessageTime(message.createdAt)}
                                </time>
                            </div>
                            <div className="chat-bubble flex flex-col">
                                {message.image && (
                                    <img
                                        src={message.image}
                                        alt="Attachment"
                                        className="sm:max-w-[200px] rounded-md mb-2"
                                    />
                                )}
                                {messageContent && <p>{messageContent}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <MessageInput />
        </div>
    );
};
export default ChatContainer;
