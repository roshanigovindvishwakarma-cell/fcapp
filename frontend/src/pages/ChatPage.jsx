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

            return () => {
                socket.off('receive_message');
                socket.off('typing');
                socket.off('stop_typing');
            };
        }
    }, [socket, selectedUser]);

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
            await axios.post('/api/messages', messageData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            socket.emit('send_message', messageData);
            setMessages((prev) => [...prev, messageData]);
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
                "w-full md:max-w-[400px] border-r border-gray-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shadow-sm z-30 transition-all duration-300 absolute md:relative h-full",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#059669] p-2 rounded-xl shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conversations</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <a 
                                href="https://github.com/roshanigovindvishwakarma-cell/fcapp" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-primary hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                title="View on GitHub"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <button onClick={onLogout} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium dark:text-white dark:placeholder:text-slate-500"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
                    {filteredUsers.map((u) => (
                        <button 
                            key={u._id}
                            onClick={() => {
                                setSelectedUser(u);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={twMerge(
                                "w-full p-4 flex items-center gap-4 rounded-[20px] transition-all group relative text-left",
                                selectedUser?._id === u?._id ? "bg-emerald-50/70 dark:bg-emerald-900/20 shadow-sm" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <div className="relative">
                                <img src={`https://i.pravatar.cc/100?u=${u._id}`} className="w-14 h-14 rounded-[22px] border-2 border-white avatar-shadow object-cover" alt={u.name} />
                                {onlineUsers.includes(u._id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full status-online-glow"></div>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">{u.name}</h3>
                                    {u.lastMessage && (
                                        <span className="text-[10px] font-bold text-gray-300">
                                            {new Date(u.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className={clsx(
                                        "text-xs font-medium truncate max-w-[160px]",
                                        typingUsers.includes(u._id) ? "text-emerald-600 font-bold animate-pulse" : "text-gray-400"
                                    )}>
                                        {typingUsers.includes(u._id) ? "Typing..." : (
                                            u.lastMessage ? (
                                                <span className="flex items-center gap-1">
                                                    {u.lastMessage.senderId === user._id && <Check className="w-3 h-3" />}
                                                    {u.lastMessage.image ? "Sent an image" : u.lastMessage.content}
                                                </span>
                                            ) : (onlineUsers.includes(u._id) ? "Active now" : "Offline")
                                        )}
                                    </p>
                                    {u.lastMessage && !u.lastMessage.isRead && u.lastMessage.senderId !== user._id && (
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                            {selectedUser?._id === u._id && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#059669] rounded-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-50 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-900/20">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <img src={`https://i.pravatar.cc/100?u=${user._id}`} className="w-10 h-10 rounded-xl" alt={user.name} />
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">{user.name}</p>
                            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider">Online Profile</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative h-full">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 md:p-5 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
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
                                <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-emerald-600 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f8fafc]/50 dark:bg-slate-950/50 custom-scrollbar">
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
                                    (m.message && m.message.toLowerCase().includes(msgSearchQuery.toLowerCase()))
                                ).map((msg, idx, filtered) => {
                                const isMe = msg.senderId === user._id;
                                const prevMsg = filtered[idx - 1];
                                const isNewDay = !prevMsg || 
                                    new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                                
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
                                        <div className={clsx("flex flex-col animate-message", isMe ? "items-end" : "items-start")}>
                                        <div className={twMerge(
                                            "max-w-[70%] p-4 shadow-sm overflow-hidden transition-all",
                                            isMe ? "chat-bubble-sender shadow-emerald-200/50 dark:shadow-emerald-950/20" : "chat-bubble-receiver dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                                        )}>
                                            {msg.image && (
                                                <img src={msg.image} alt="Sent" className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.image, '_blank')} />
                                            )}
                                            {msg.message && <p className="text-sm font-medium leading-relaxed">{msg.message}</p>}
                                        </div>
                                        <div className={clsx("flex items-center gap-1 mt-1.5 px-1", isMe ? "justify-end" : "justify-start")}>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
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
                        <div className="p-6 bg-white dark:bg-slate-950">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                                <div className="flex-1 relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <div className="relative">
                                            <button 
                                                type="button" 
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                                            >
                                                <Smile className="w-5 h-5" />
                                            </button>
                                            <AnimatePresence>
                                                {showEmojiPicker && (
                                              <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-12 left-0 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 w-64"
                                                    >
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {emojis.map((emoji, i) => (
                                                                <button 
                                                                    key={i} 
                                                                    type="button"
                                                                    onClick={() => handleEmojiClick(emoji)}
                                                                    className="text-xl hover:bg-gray-50 p-2 rounded-xl transition-colors"
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
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="w-full pl-24 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-500/10 transition-all outline-none font-medium dark:text-white dark:placeholder:text-slate-500"
                                        placeholder="Type your message here..."
                                        value={newMessage}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                                        onChange={handleInputChange}
                                    />
                                    <button 
                                        type="submit" 
                                        className={twMerge(
                                            "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all shadow-md active:scale-95 btn-hover-effect",
                                            newMessage.trim() ? "bg-[#059669] text-white shadow-emerald-200 dark:shadow-emerald-950/40" : "bg-gray-200 dark:bg-slate-800 text-white dark:text-slate-600 shadow-none cursor-not-allowed"
                                        )}
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
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
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #e2e8f0;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ChatPage;
