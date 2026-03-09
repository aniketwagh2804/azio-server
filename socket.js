const Message = require('./models/Message');

const userSockets = {}; // Map of username -> socketId

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // When user authenticates with socket
        socket.on('register', async (username) => {
            userSockets[username] = socket.id;
            console.log(`${username} registered with socket ${socket.id}`);

            // Send undelivered messages
            try {
                const offlineMessages = await Message.find({ receiverId: username, status: 'sent' });
                if (offlineMessages.length > 0) {
                    socket.emit('offline_messages', offlineMessages);
                    // Mark as delivered
                    await Message.updateMany(
                        { _id: { $in: offlineMessages.map(m => m._id) } },
                        { $set: { status: 'delivered' } }
                    );
                }
            } catch (err) {
                console.error("Error fetching offline messages", err);
            }
        });

        // Handle incoming E2EE messages
        socket.on('send_message', async (data) => {
            const { senderId, receiverId, encryptedContent } = data;

            try {
                const newMessage = new Message({
                    senderId,
                    receiverId,
                    encryptedContent,
                    status: 'sent'
                });
                await newMessage.save();

                const receiverSocketId = userSockets[receiverId];

                if (receiverSocketId) {
                    // Receiver is online, deliver immediately
                    io.to(receiverSocketId).emit('receive_message', newMessage);
                    newMessage.status = 'delivered';
                    await newMessage.save();

                    // Notify sender it was delivered
                    socket.emit('message_status', { messageId: newMessage._id, status: 'delivered' });
                } else {
                    // Receiver is offline, trigger push notification logic here
                    // sendDisguisedPushNotification(receiverId);
                }
            } catch (err) {
                console.error("Error handling message:", err);
            }
        });

        socket.on('disconnect', () => {
            // Remove from map securely
            for (let user in userSockets) {
                if (userSockets[user] === socket.id) {
                    delete userSockets[user];
                    break;
                }
            }
            console.log('User disconnected:', socket.id);
        });
    });
};
