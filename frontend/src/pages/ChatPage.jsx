import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { 
    MessageSquare, Search, Send, LogOut, User as UserIcon, 
    MoreVertical, Phone, Video, Smile, Paperclip, Check, CheckCheck, Github 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const ChatPage = ({ user, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [msgSearchQuery, setMsgSearchQuery] = useState('');
    const [typingUsers, setTypingUsers] = useState([]); // List of user IDs typing to us
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { socket, onlineUsers } = useSocket();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    // Safety guard
    if (!user || !user.token) return null;

    useEffect(() => {
        if (!user?.token) return;
        const fetchUsers = async () => {
            try {
                const res = await axios.get('/api/users', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setUsers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, [user?.token]);

    useEffect(() => {
        if (selectedUser && user?.token) {
            const fetchMessages = async () => {
                try {
                    const res = await axios.get(`/api/messages/${selectedUser._id}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    setMessages(Array.isArray(res.data) ? res.data : []);
                    
                    // Mark messages as read when opening chat
                    await axios.put(`/api/messages/mark-read/${selectedUser._id}`, {}, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });

                    // Update local users list to clear unread indicator
                    setUsers(prevUsers => prevUsers.map(u => {
                        if (u._id === selectedUser._id && u.lastMessage) {
                            return { ...u, lastMessage: { ...u.lastMessage, isRead: true } };
                        }
                        return u;
                    }));
                } catch (err) {
                    console.error(err);
                }
            };
            fetchMessages();
        }
    }, [selectedUser, user.token]);

    useEffect(() => {
        if (socket) {
            socket.on('receive_message', (message) => {
                const isFromSelectedUser = selectedUser && message.senderId === selectedUser._id;
                
                if (isFromSelectedUser) {
                    setMessages((prev) => [...prev, message]);
                    // Auto mark as read if chat is open
                    axios.put(`/api/messages/mark-read/${message.senderId}`, {}, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }).catch(err => console.error("Failed to mark as read:", err));
                }

                // Update sidebar last message for the sender
                setUsers(prevUsers => prevUsers.map(u => {
                    if (u._id === message.senderId) {
                        return {
                            ...u,
                            lastMessage: {
                                content: message.message,
                                image: message.image,
                                createdAt: new Date(),
                                senderId: message.senderId,
                                isRead: isFromSelectedUser
                            }
                        };
                    }
                    return u;
                }));
            });

            socket.on('typing', ({ senderId }) => {
                if (selectedUser && senderId === selectedUser._id) {
                    setIsTyping(true);
                }
                setTypingUsers(prev => prev.includes(senderId) ? prev : [...prev, senderId]);
            });

            socket.on('stop_typing', ({ senderId }) => {
                if (selectedUser && senderId === selectedUser._id) {
                    setIsTyping(false);
                }
                setTypingUsers(prev => prev.filter(id => id !== senderId));
            });

            socket.on('message_read', ({ messageId }) => {
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isRead: true } : m));
            });

            socket.on('message_deleted', ({ messageId, type }) => {
                if (type === 'everyone') {
                    setMessages(prev => prev.map(m => 
                        m._id === messageId ? { ...m, isDeleted: true, message: 'This message was deleted', image: null } : m
                    ));
                }
            });

            return () => {
                socket.off('receive_message');
                socket.off('typing');
                socket.off('stop_typing');
                socket.off('message_read');
                socket.off('message_deleted');
            };
        }
    }, [socket, selectedUser]);

    // Mark incoming messages as read
    useEffect(() => {
        if (selectedUser && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.senderId === selectedUser._id && !lastMsg.isRead) {
                socket.emit('mark_read', { messageId: lastMsg._id, senderId: user._id });
            }
        }
    }, [messages, selectedUser, socket, user._id]);

    useEffect(() => {
        const searchServerMessages = async () => {
            if (msgSearchQuery.length > 2 && user?.token) {
                try {
                    const res = await axios.get(`/api/messages/search?query=${msgSearchQuery}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    setMessages(res.data);
                } catch (err) {
                    console.error("Search error:", err);
                }
            }
        };
        const timeoutId = setTimeout(searchServerMessages, 500);
        return () => clearTimeout(timeoutId);
    }, [msgSearchQuery, user?.token]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e, imageOverride = null) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !imageOverride && !selectedUser) return;

        const messageData = {
            receiverId: selectedUser._id,
            message: newMessage,
            image: imageOverride,
            senderId: user._id,
            timestamp: new Date()
        };

        try {
            const res = await axios.post('/api/messages', messageData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const savedMsg = res.data;
            socket.emit('send_message', savedMsg);
            setMessages((prev) => [...prev, savedMsg]);
            setNewMessage('');
            socket.emit('stop_typing', { senderId: user._id, receiverId: selectedUser._id });

            // Update sidebar last message for ourself
            setUsers(prevUsers => prevUsers.map(u => {
                if (u._id === selectedUser._id) {
                    return {
                        ...u,
                        lastMessage: {
                            content: messageData.message,
                            image: messageData.image,
                            createdAt: new Date(),
                            senderId: user._id,
                            isRead: true
                        }
                    };
                }
                return u;
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteMessage = async (messageId, type) => {
        try {
            await axios.post('/api/messages/delete', { messageId, type }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            if (type === 'everyone') {
                socket.emit('delete_message', { messageId, receiverId: selectedUser._id, type: 'everyone' });
                setMessages(prev => prev.map(m => 
                    m._id === messageId ? { ...m, isDeleted: true, message: 'This message was deleted', image: null } : m
                ));
            } else {
                // Delete for me
                setMessages(prev => prev.filter(m => m._id !== messageId));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple base64 conversion
        const reader = new FileReader();
        reader.onloadend = () => {
            handleSendMessage(null, reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleEmojiClick = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleBlockUser = async () => {
        if (!selectedUser) return;
        try {
            await axios.post('/api/users/block', { userId: selectedUser._id }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Update local state
            setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, blockedByMe: true } : u));
            setSelectedUser(prev => ({ ...prev, blockedByMe: true }));
        } catch (err) { console.error(err); }
    };

    const handleUnblockUser = async () => {
        if (!selectedUser) return;
        try {
            await axios.post('/api/users/unblock', { userId: selectedUser._id }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Update local state
            setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, blockedByMe: false } : u));
            setSelectedUser(prev => ({ ...prev, blockedByMe: false }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action is permanent.")) return;
        try {
            await axios.delete('/api/user/account', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            onLogout();
        } catch (err) { console.error(err); }
    };

    const emojis = ['👇','🎨','🔥','🚀','💎','✨','🌈','🤝','⚡️','🎉','❤️','😂','😍','😎','👍','🙏','🤔','🙌','💡','✅'];
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (selectedUser) {
            if (e.target.value.length > 0) {
                socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id });
            } else {
                socket.emit('stop_typing', { senderId: user._id, receiverId: selectedUser._id });
            }
        }
    };

    const filteredUsers = Array.isArray(users) ? users.filter(u => 
        (u?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u?.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : [];

    return (
        <div className="flex h-screen atrium-mesh overflow-hidden relative">
            {/* Sidebar */}
            <div className={twMerge(
                "w-full md:max-w-[360px] border-r border-[#282D45] flex flex-col bg-[#1E2235] shadow-2xl z-30 transition-all duration-300 absolute md:relative h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 space-y-6 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#5E5CE6] p-2 rounded-xl shadow-lg">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">NexaChat</h1>
                        </div>
                        <button onClick={onLogout} className="p-2 rounded-xl text-slate-500 hover:text-white transition-all">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            className="w-full pl-11 pr-4 py-3 bg-[#282D45] border-none rounded-xl focus:ring-1 focus:ring-slate-600 transition-all outline-none text-sm font-medium text-white placeholder:text-slate-500"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Online Now</h3>
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
                            {onlineUsers.filter(id => {
                                const u = users.find(u => u._id === id);
                                return id !== user._id && !u?.blockedByMe && !u?.blockedByThem;
                            }).map(id => {
                                const onlineUser = users.find(u => u._id === id);
                                if (!onlineUser) return null;
                                return (
                                    <div key={id} className="flex flex-col items-center gap-2 min-w-[50px] cursor-pointer" onClick={() => setSelectedUser(onlineUser)}>
                                        <div className="relative">
                                            <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-sm font-bold border-2 border-slate-700 bg-slate-800 text-white hover:border-primary transition-colors">
                                                {onlineUser?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1E2235] rounded-full"></div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">{onlineUser?.name?.split(' ')[0] || 'User'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-4">Messages</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                            {filteredUsers.map((u) => (
                                <button 
                                    key={u._id}
                                    onClick={() => {
                                        setSelectedUser(u);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={twMerge(
                                        "w-full p-3.5 flex items-center gap-4 transition-all rounded-xl relative text-left group",
                                        selectedUser?._id === u?._id ? "bg-[#282D45] shadow-lg" : "hover:bg-slate-800/40"
                                    )}
                                >
                                    <div className="relative">
                                        <div className={twMerge(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 border-slate-700 bg-slate-800 text-white group-hover:border-slate-500 transition-colors",
                                            selectedUser?._id === u?._id && "border-primary"
                                        )}>
                                            {u?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                        </div>
                                        {onlineUsers.includes(u._id) && (
                                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1E2235] rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="font-bold text-white text-sm truncate">{u.name}</h3>
                                            <span className="text-[10px] font-medium text-slate-500">
                                                {u.lastMessage ? new Date(u.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={clsx(
                                                "text-xs font-medium truncate",
                                                typingUsers.includes(u._id) ? "text-primary font-bold animate-pulse" : "text-slate-500"
                                            )}>
                                                {typingUsers.includes(u._id) ? "Typing..." : (
                                                    u.lastMessage ? u.lastMessage.content : "No messages yet"
                                                )}
                                            </p>
                                            {u.lastMessage && !u.lastMessage.isRead && u.lastMessage.senderId !== user._id && (
                                                <div className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[20px]">
                                                    1
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#282D45] bg-[#1E2235]">
                    <div onClick={async () => {
                        const newName = prompt("Enter new name:", user.name);
                        if (newName && newName !== user.name) {
                            try {
                                const res = await axios.put('/api/users/update-profile', { name: newName }, {
                                    headers: { Authorization: `Bearer ${user.token}` }
                                });
                                alert("Name updated! Please refresh to see changes.");
                            } catch (err) { console.error(err); }
                        }
                    }} className="flex items-center gap-3 p-3 bg-[#282D45] rounded-xl shadow-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-white">
                            {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Edit Profile</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-[#141625] relative h-full">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 md:p-5 border-b border-[#282D45] flex items-center justify-between z-10 bg-[#141625]/80 backdrop-blur-md">
                            <div className="flex items-center gap-3 md:gap-4">
                                <button 
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="md:hidden p-2 hover:bg-gray-50 rounded-xl text-gray-400"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                                <div className="relative">
                                    <img src={`https://i.pravatar.cc/100?u=${selectedUser._id}`} className="w-12 h-12 rounded-2xl avatar-shadow border border-gray-100" />
                                    {onlineUsers.includes(selectedUser._id) && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full status-online-glow"></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">{selectedUser.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={clsx("w-1.5 h-1.5 rounded-full", onlineUsers.includes(selectedUser._id) ? "bg-emerald-500" : "bg-gray-300")}></div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            {onlineUsers.includes(selectedUser._id) ? "Online" : "Last seen recently"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative group mr-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search messages..." 
                                        className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border-none rounded-xl text-xs w-0 group-hover:w-48 focus:w-48 transition-all outline-none dark:text-white dark:placeholder:text-slate-500"
                                        value={msgSearchQuery}
                                        onChange={(e) => setMsgSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-emerald-600 transition-colors"><Phone className="w-5 h-5" /></button>
                                <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-emerald-600 transition-colors"><Video className="w-5 h-5" /></button>
                                <div className="relative group/menu">
                                    <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-emerald-600 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 group-hover/menu:opacity-100 transition-all z-50 overflow-hidden pointer-events-none group-hover/menu:pointer-events-auto">
                                        {selectedUser?.blockedByMe ? (
                                            <button onClick={handleUnblockUser} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-slate-800 transition-colors">Unblock User</button>
                                        ) : (
                                            <button onClick={handleBlockUser} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800 transition-colors font-bold">Block User</button>
                                        )}
                                        <button onClick={handleDeleteAccount} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-slate-800 transition-colors border-t border-slate-800">Delete My Account</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#1a1d2d] custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <MessageSquare className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">No messages yet</p>
                                        <p className="text-xs font-medium dark:text-slate-400">Send a message to start the conversation</p>
                                    </div>
                                </div>
                            ) : (
                                messages.filter(m => 
                                    !msgSearchQuery || 
                                    (m?.message && m.message.toLowerCase().includes(msgSearchQuery.toLowerCase()))
                                ).map((msg, idx, filtered) => {
                                    if (!msg) return null;
                                    const isMe = msg.senderId === user._id;
                                    const prevMsg = filtered[idx - 1];
                                    const isNewDay = !prevMsg || 
                                        new Date(msg.timestamp).toDateString() !== new Date(prevMsg?.timestamp).toDateString();
                                    
                                    return (
                                        <React.Fragment key={idx}>
                                            {isNewDay && (
                                                <div className="flex justify-center my-8">
                                                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-100 dark:border-slate-800 px-4 py-1.5 rounded-full shadow-sm">
                                                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                            {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className={clsx("flex flex-col animate-message group/msg", isMe ? "items-end" : "items-start")}>
                                                <div className="relative group">
                                                    <div className={twMerge(
                                                        "max-w-full p-3 md:p-4 shadow-sm overflow-hidden transition-all rounded-2xl",
                                                        isMe ? "chat-bubble-sender shadow-emerald-200/50" : "chat-bubble-receiver",
                                                        msg.isDeleted ? "opacity-50 italic text-[10px]" : ""
                                                    )}>
                                                        {msg.image && !msg.isDeleted && (
                                                            <img src={msg.image} alt="Sent" className="max-w-full rounded-lg mb-2 cursor-pointer" onClick={() => window.open(msg.image, '_blank')} />
                                                        )}
                                                        <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                                    </div>
                                                    
                                                    {!msg.isDeleted && (
                                                        <div className={clsx(
                                                            "absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-all z-20 flex gap-1",
                                                            isMe ? "-left-20" : "-right-20"
                                                        )}>
                                                            <button 
                                                                onClick={() => handleDeleteMessage(msg._id, 'me')}
                                                                className="p-1 px-2 bg-slate-800/80 rounded-lg text-slate-400 hover:text-white text-[9px] uppercase font-bold tracking-tighter"
                                                            >Me</button>
                                                            {isMe && (
                                                                <button 
                                                                    onClick={() => handleDeleteMessage(msg._id, 'everyone')}
                                                                    className="p-1 px-2 bg-red-950/60 rounded-lg text-red-300 hover:bg-red-900 text-[9px] uppercase font-bold tracking-tighter"
                                                                >All</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={clsx("flex items-center gap-1 mt-1.5 px-1", isMe ? "justify-end" : "justify-start")}>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMe && !msg.isDeleted && (
                                                        <CheckCheck className={twMerge(
                                                            "w-3.5 h-3.5 transition-colors",
                                                            msg.status === 'seen' || msg.isRead ? "text-[#3B82F6]" : "text-slate-500"
                                                        )} />
                                                    )}
                                                </div>
                                            </div>
                                    </React.Fragment>
                                );
                            })
                        )}
                        <AnimatePresence>
                                {isTyping && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex flex-col items-start"
                                    >
                                        <div className="chat-bubble-receiver dark:bg-slate-900 dark:border-slate-800 p-4 flex gap-1 items-center">
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={scrollRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-6 bg-[#141625] border-t border-[#282D45]">
                            {selectedUser?.blockedByMe || selectedUser?.blockedByThem ? (
                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-center">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                        {selectedUser?.blockedByMe ? "You have blocked this user" : "You cannot message this user"}
                                    </p>
                                    {selectedUser?.blockedByMe && (
                                        <button onClick={handleUnblockUser} className="mt-2 text-xs font-bold text-primary hover:underline">Unblock to send messages</button>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <div className="relative">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                                >
                                                    <Smile className="w-5 h-5" />
                                                </button>
                                                <AnimatePresence>
                                                    {showEmojiPicker && (
                                                <motion.div 
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute bottom-12 left-0 bg-[#282D45] p-3 rounded-2xl shadow-2xl border border-slate-700 z-50 w-64"
                                                        >
                                                            <div className="grid grid-cols-5 gap-2">
                                                                {emojis.map((emoji, i) => (
                                                                    <button 
                                                                        key={i} 
                                                                        type="button"
                                                                        onClick={() => handleEmojiClick(emoji)}
                                                                        className="text-xl hover:bg-slate-700 p-2 rounded-xl transition-colors"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current.click()}
                                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <input 
                                            type="text" 
                                            className="w-full pl-24 pr-4 py-4 bg-[#1E2235] border-none rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all outline-none font-medium text-white placeholder:text-slate-600"
                                            placeholder="Type your message here..."
                                            value={newMessage}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                                            onChange={handleInputChange}
                                        />
                                        <button 
                                            type="submit" 
                                            className={twMerge(
                                                "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all shadow-md active:scale-95 btn-hover-effect",
                                                newMessage.trim() ? "bg-primary text-white shadow-primary/20" : "bg-slate-800 text-slate-600 shadow-none cursor-not-allowed"
                                            )}
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/30 dark:bg-slate-950/30">
                        <div className="w-24 h-24 bg-white dark:bg-slate-900 shadow-2xl shadow-emerald-900/5 dark:shadow-emerald-950/20 rounded-[2.5rem] flex items-center justify-center mb-8 animate-pulse border border-transparent dark:border-slate-800">
                            <MessageSquare className="w-10 h-10 text-emerald-100 dark:text-emerald-900/30" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to your Atrium</h3>
                        <p className="text-gray-400 dark:text-slate-500 text-center max-w-sm font-medium">Select a conversation from the sidebar to begin your crystal-clear digital communication.</p>
                        
                        <div className="mt-12 grid grid-cols-2 gap-4 max-w-md w-full">
                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                                <div className="bg-blue-50 dark:bg-blue-900/20 w-8 h-8 rounded-lg flex items-center justify-center"><Phone className="w-4 h-4 text-blue-500" /></div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">HD Voice Calls</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Crystal clear audio connection coming soon.</p>
                            </div>
                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 w-8 h-8 rounded-lg flex items-center justify-center"><Video className="w-4 h-4 text-emerald-500" /></div>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">Video Conf</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Professional grade meetings in one click.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #282D45;
                    border-radius: 10px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default ChatPage;
