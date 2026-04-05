import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import PageLayout from "../../../shared/components/PageLayout";
import {
  Card,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Button,
  Spinner,
  Alert,
} from "@heroui/react";

const SOCKET_URL =
  import.meta.env.VITE_MATCHING_API_GATEWAY_URL ||
  "http://localhost:3000/api/matching-service";

export default function MatchingPage() {
  const navigate = useNavigate();

  // State for form inputs
  const [difficulty, setDifficulty] = useState("easy");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // State for matching
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to matching service");
      setError(null);
    });

    newSocket.on(
      "match-found",
      (data: { roomId: string; partnerId: string }) => {
        console.log("Match found!", data);
        setIsSearching(false);
        // Navigate to collaboration room with the matched partner
        navigate(`/collaboration/${data.roomId}`, {
          state: { partnerId: data.partnerId },
        });
      },
    );

    newSocket.on("match-timeout", (data: { message: string }) => {
      console.log("Match timeout:", data.message);
      setIsSearching(false);
      setError("No match found within 2 minutes. Please try again.");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from matching service");
      setError("Connection lost to matching service");
    });

    newSocket.on("error", (err: any) => {
      console.error("Socket error:", err);
      setError("Connection error to matching service");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  const handleFindMatch = async () => {
    if (!selectedLanguages.length || !selectedTopics.length) {
      setError("Please select at least one language and one topic");
      return;
    }

    setError(null);
    setIsSearching(true);

    const userId = "user123"; // Replace with actual user ID from auth

    // Emit the find-match event
    socket.emit("find-match", {
      userId,
      language: selectedLanguages,
      difficulty,
      category: selectedTopics,
    });
  };

  const handleCancel = () => {
    setIsSearching(false);
    socket.emit("cancel-match");
  };

  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-3xl font-bold mb-4">Find Your Coding Partner</h1>

        {error && (
          <Alert
            color="danger"
            title="Error"
            className="mb-4 w-full max-w-md"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Card className="w-full max-w-md p-6">
          <p className="text-gray-600 mb-4">
            Choose your criteria to find a perfect match for pair programming!
          </p>

          {/* Difficulty level selections */}
          <RadioGroup
            orientation="horizontal"
            label="Difficulty Level"
            value={difficulty}
            onValueChange={setDifficulty}
            className="mt-4"
          >
            <Radio value="easy">Easy</Radio>
            <Radio value="medium">Medium</Radio>
            <Radio value="hard">Hard</Radio>
          </RadioGroup>

          {/* Topic selections */}
          <CheckboxGroup
            orientation="horizontal"
            label="Topics (Select at least 1)"
            value={selectedTopics}
            onValueChange={setSelectedTopics}
            className="mt-4"
          >
            <Checkbox value="arrays">Arrays</Checkbox>
            <Checkbox value="linked-lists">Linked Lists</Checkbox>
            <Checkbox value="trees">Trees</Checkbox>
          </CheckboxGroup>

          {/* Language selections */}
          <CheckboxGroup
            orientation="horizontal"
            label="Languages (Select at least 1)"
            value={selectedLanguages}
            onValueChange={setSelectedLanguages}
            className="mt-4"
          >
            <Checkbox value="javascript">JavaScript</Checkbox>
            <Checkbox value="python">Python</Checkbox>
            <Checkbox value="java">Java</Checkbox>
          </CheckboxGroup>

          {/* Submit button */}
          {!isSearching ? (
            <Button
              className="mt-6 w-full"
              color="primary"
              size="lg"
              onPress={handleFindMatch}
            >
              Find Match
            </Button>
          ) : (
            <>
              <div className="flex justify-center items-center gap-2 mt-6">
                <Spinner size="sm" />
                <span>Searching for a match...</span>
              </div>
              <Button
                className="mt-4 w-full"
                variant="bordered"
                onPress={handleCancel}
              >
                Cancel Search
              </Button>
            </>
          )}
        </Card>

        {isSearching && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Finding a partner with similar interests...</p>
            <p className="mt-2">The search will timeout after 2 minutes</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
