import socketHandler from "../../sockets/socket-handler.js";

afterEach(() => jest.clearAllMocks());

function buildMocks() {
  const mockSocket = {
    id: "socket-id-1",
    join: jest.fn(),
    on: jest.fn(),
  };
  const mockEmit = jest.fn();
  const mockIo = {
    on: jest.fn(),
    to: jest.fn(() => ({ emit: mockEmit })),
  };
  return { mockSocket, mockIo, mockEmit };
}

function connect(mockIo, mockSocket) {
  socketHandler(mockIo);
  const connectionHandler = mockIo.on.mock.calls[0][1];
  connectionHandler(mockSocket);

  function getHandler(eventName) {
    const call = mockSocket.on.mock.calls.find(([ev]) => ev === eventName);
    return call ? call[1] : null;
  }
  return getHandler;
}

/////////////////////////////////////////////////////
// connection
/////////////////////////////////////////////////////
describe("socketHandler — connection", () => {
  test("registers a 'connection' listener on io", () => {
    const { mockIo, mockSocket } = buildMocks();
    connect(mockIo, mockSocket);
    expect(mockIo.on).toHaveBeenCalledWith("connection", expect.any(Function));
  });

  test("registers join_room, send_message, and disconnect listeners on the socket", () => {
    const { mockIo, mockSocket } = buildMocks();
    connect(mockIo, mockSocket);
    const registeredEvents = mockSocket.on.mock.calls.map(([ev]) => ev);
    expect(registeredEvents).toContain("join_room");
    expect(registeredEvents).toContain("send_message");
    expect(registeredEvents).toContain("disconnect");
  });
});

/////////////////////////////////////////////////////
// join_room
/////////////////////////////////////////////////////
describe("join_room event", () => {
  test("calls socket.join with the given roomId", () => {
    const { mockIo, mockSocket } = buildMocks();
    const getHandler = connect(mockIo, mockSocket);

    getHandler("join_room")("room-abc");

    expect(mockSocket.join).toHaveBeenCalledWith("room-abc");
  });
});

/////////////////////////////////////////////////////
// send_message
/////////////////////////////////////////////////////
describe("send_message event", () => {
  test("emits receive_message to the correct room with { id, text }", () => {
    const { mockIo, mockSocket, mockEmit } = buildMocks();
    const getHandler = connect(mockIo, mockSocket);

    getHandler("send_message")({ roomId: "r1", message: "hello" });

    expect(mockIo.to).toHaveBeenCalledWith("r1");
    expect(mockEmit).toHaveBeenCalledWith(
      "receive_message",
      expect.objectContaining({ text: "hello" }),
    );
    const msg = mockEmit.mock.calls[0][1];
    expect(typeof msg.id).toBe("number");
  });

  test("message id is set to Date.now()", () => {
    const { mockIo, mockSocket, mockEmit } = buildMocks();
    const getHandler = connect(mockIo, mockSocket);
    jest.spyOn(Date, "now").mockReturnValue(99999);

    getHandler("send_message")({ roomId: "r1", message: "hi" });

    expect(mockEmit).toHaveBeenCalledWith("receive_message", {
      id: 99999,
      text: "hi",
    });
    Date.now.mockRestore();
  });

  test("empty string message is emitted as per original", () => {
    const { mockIo, mockSocket, mockEmit } = buildMocks();
    const getHandler = connect(mockIo, mockSocket);

    getHandler("send_message")({ roomId: "r1", message: "" });

    expect(mockEmit).toHaveBeenCalledWith(
      "receive_message",
      expect.objectContaining({ text: "" }),
    );
  });

  test("broadcasts to the correct room when multiple calls use different roomIds", () => {
    const { mockIo, mockSocket } = buildMocks();
    const getHandler = connect(mockIo, mockSocket);

    getHandler("send_message")({ roomId: "r1", message: "m1" });
    getHandler("send_message")({ roomId: "r2", message: "m2" });

    expect(mockIo.to.mock.calls[0][0]).toBe("r1");
    expect(mockIo.to.mock.calls[1][0]).toBe("r2");
  });
});

/////////////////////////////////////////////////////
// disconnect
/////////////////////////////////////////////////////
describe("disconnect event", () => {
  test("does not throw error when the disconnect handler is called", () => {
    const { mockIo, mockSocket } = buildMocks();
    const getHandler = connect(mockIo, mockSocket);
    expect(() => getHandler("disconnect")()).not.toThrow();
  });
});
