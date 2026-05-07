import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api/constants';

interface SocketState {
  chatSocket: Socket | null;
  locationSocket: Socket | null;
  dmSocket: Socket | null;
  connectChat: (token: string) => void;
  connectLocation: (token: string) => void;
  connectDm: (token: string) => void;
  disconnectAll: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  chatSocket: null,
  locationSocket: null,
  dmSocket: null,

  connectChat: (token) => {
    get().chatSocket?.disconnect();
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    set({ chatSocket: socket });
  },

  connectLocation: (token) => {
    get().locationSocket?.disconnect();
    const socket = io(`${API_URL}/location`, {
      auth: { token },
      transports: ['websocket'],
    });
    set({ locationSocket: socket });
  },

  connectDm: (token) => {
    get().dmSocket?.disconnect();
    const socket = io(`${API_URL}/dm`, {
      auth: { token },
      transports: ['websocket'],
    });
    set({ dmSocket: socket });
  },

  disconnectAll: () => {
    get().chatSocket?.disconnect();
    get().locationSocket?.disconnect();
    get().dmSocket?.disconnect();
    set({ chatSocket: null, locationSocket: null, dmSocket: null });
  },
}));
