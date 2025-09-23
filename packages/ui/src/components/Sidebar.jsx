import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Plus, MessageCircle } from "lucide-react";

const Sidebar = () => {
    const { 
        getUsers, 
        users, 
        selectedUser, 
        setSelectedUser, 
        isUsersLoading,
        getConversations,
        conversations,
        isConversationsLoading,
        createDirectConversation
    } = useChatStore();

    const { onlineUsers, authUser } = useAuthStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [showUsers, setShowUsers] = useState(false);

    useEffect(() => {
        getConversations();
    }, [getConversations]);

    const handleToggleUsers = () => {
        const newShowUsers = !showUsers;
        setShowUsers(newShowUsers);
        if (newShowUsers && !users.length) {
            getUsers();
        }
    };

    const filteredUsers = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id))
        : users;

    const handleUserClick = async (user) => {
        try {
            const conversation = await createDirectConversation(user.id);
            setSelectedUser(conversation);
            setShowUsers(false);
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    };

    const getConversationDisplayInfo = (conversation) => {
        if (conversation.type === 'direct') {
            const otherMember = conversation.members.find(member => member.user.id !== authUser.id);
            return {
                name: otherMember?.user.displayName || otherMember?.user.username || 'Unknown User',
                avatar: otherMember?.user.profilePic || '/avatar.png',
                isOnline: onlineUsers.includes(otherMember?.user.id)
            };
        }
        return {
            name: conversation.name || 'Group Chat',
            avatar: conversation.avatarUrl || '/avatar.png',
            isOnline: false
        };
    };

    if (isUsersLoading || isConversationsLoading) return <SidebarSkeleton />;

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="size-6" />
                        <span className="font-medium hidden lg:block">Messages</span>
                    </div>
                    <button
                        onClick={handleToggleUsers}
                        className={`btn btn-circle btn-sm btn-ghost hover:btn-primary ${showUsers ? 'btn-primary' : ''}`}
                        title={showUsers ? "Hide Contacts" : "Show Contacts"}
                    >
                        <Plus className={`size-4 transition-transform ${showUsers ? 'rotate-45' : ''}`} />
                    </button>
                </div>
                {showUsers && (
                    <div className="mt-3 hidden lg:flex items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showOnlineOnly}
                                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                                className="checkbox checkbox-sm"
                            />
                            <span className="text-sm">Show online only</span>
                        </label>
                        <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
                    </div>
                )}
            </div>

            <div className="overflow-y-auto w-full py-3">
                {/* Conversations List */}
                {!showUsers && conversations.map((conversation) => {
                    const displayInfo = getConversationDisplayInfo(conversation);
                    return (
                        <button
                            key={conversation.id}
                            onClick={() => setSelectedUser(conversation)}
                            className={`
                                w-full p-3 flex items-center gap-3
                                hover:bg-base-300 transition-colors
                                ${selectedUser?.id === conversation.id ? "bg-base-300 ring-1 ring-base-300" : ""}
                            `}
                        >
                            <div className="relative mx-auto lg:mx-0">
                                <img
                                    src={displayInfo.avatar}
                                    alt={displayInfo.name}
                                    className="size-12 object-cover rounded-full"
                                />
                                {displayInfo.isOnline && (
                                    <span
                                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                                        rounded-full ring-2 ring-zinc-900"
                                    />
                                )}
                            </div>

                            {/* Conversation info - only visible on larger screens */}
                            <div className="hidden lg:block text-left min-w-0">
                                <div className="font-medium truncate">
                                    {displayInfo.name}
                                </div>
                                <div className="text-sm text-zinc-400">
                                    {conversation.type === 'direct' ? 
                                        (displayInfo.isOnline ? "Online" : "Offline") : 
                                        `${conversation.members?.length || 0} members`
                                    }
                                </div>
                            </div>
                        </button>
                    );
                })}

                {/* Users List */}
                {showUsers && filteredUsers.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className={`
                            w-full p-3 flex items-center gap-3
                            hover:bg-base-300 transition-colors
                        `}
                    >
                        <div className="relative mx-auto lg:mx-0">
                            <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.displayName}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span
                                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                                    rounded-full ring-2 ring-zinc-900"
                                />
                            )}
                        </div>

                        {/* User info - only visible on larger screens */}
                        <div className="hidden lg:block text-left min-w-0">
                            <div className="font-medium truncate">
                                {user.displayName}
                            </div>
                            <div className="text-sm text-zinc-400">
                                {onlineUsers.includes(user.id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {showUsers && filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No online users</div>
                )}
                
                {!showUsers && conversations.length === 0 && (
                    <div className="text-center text-zinc-500 py-8">
                        <div className="mb-2">
                            <MessageCircle className="size-12 mx-auto opacity-50" />
                        </div>
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs mt-1">Click the + button to start chatting</p>
                    </div>
                )}
            </div>
        </aside>
    );
};
export default Sidebar;
