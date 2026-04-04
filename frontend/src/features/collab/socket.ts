import { io } from "socket.io-client";
import { API_URL } from "./services/api.ts";

export const socket = io(API_URL);