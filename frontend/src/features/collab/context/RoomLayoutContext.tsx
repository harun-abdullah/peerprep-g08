import { createContext, useState, type ReactNode } from "react";

export interface RoomLayoutState {
  questionCollapsed: boolean;
  chatCollapsed: boolean;
  toggleQuestion: () => void;
  toggleChat: () => void;
}

export const RoomLayoutContext = createContext<RoomLayoutState | undefined>(undefined);

export function RoomLayoutProvider({ children }: { children: ReactNode }) {
  const [questionCollapsed, setQuestionCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const toggleQuestion = () => setQuestionCollapsed((prev) => !prev);
  const toggleChat = () => setChatCollapsed((prev) => !prev);

  return (
    <RoomLayoutContext.Provider
      value={{ questionCollapsed, chatCollapsed, toggleQuestion, toggleChat }}
    >
      {children}
    </RoomLayoutContext.Provider>
  );
}
