import { useContext } from "react";
import { PlaygroundContext } from "../contexts/PlaygroundContext";

export const usePlaygroundContext = () => {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error(
      "usePlaygroundContext must be used within PlaygroundProvider"
    );
  }
  return context;
};
