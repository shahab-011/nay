import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket,      setSocket]      = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // No auth → ensure disconnected
    if (!user || !token) {
      setSocket((prev) => { prev?.disconnect(); return null; });
      setIsConnected(false);
      return;
    }

    const s = io(SOCKET_URL, {
      auth:            { token, userName: user.name },
      reconnection:    true,
      reconnectionDelay: 1000,
      transports:      ['websocket', 'polling'],
    });

    s.on('connect',    () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));
    s.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?._id, token]); // only reconnect when identity changes

  /** Join a document collaboration room. */
  const joinRoom = useCallback((roomId) => {
    socket?.emit('join-room', roomId);
  }, [socket]);

  /** Leave a room (cleanup on unmount). */
  const leaveRoom = useCallback((roomId) => {
    socket?.emit('leave-room', roomId);
  }, [socket]);

  /** Manually broadcast a client-side update (cursors, local edits). */
  const emitUpdate = useCallback((roomId, data) => {
    socket?.emit('document-update', { roomId, data });
  }, [socket]);

  /** Emit typing-start so collaborators see a typing indicator. */
  const emitTypingStart = useCallback((roomId, clauseIndex) => {
    socket?.emit('typing-start', { roomId, clauseIndex });
  }, [socket]);

  /** Emit typing-stop to clear the typing indicator on collaborators' screens. */
  const emitTypingStop = useCallback((roomId) => {
    socket?.emit('typing-stop', { roomId });
  }, [socket]);

  /** Emit cursor-move so collaborators can see which clause you are reading. */
  const emitCursorMove = useCallback((roomId, clauseIndex) => {
    socket?.emit('cursor-move', { roomId, clauseIndex });
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom, emitUpdate, emitTypingStart, emitTypingStop, emitCursorMove }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
