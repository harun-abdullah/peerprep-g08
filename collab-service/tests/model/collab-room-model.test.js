var mockCollabRoom;

jest.mock("mongoose", () => {
  mockCollabRoom = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  function Schema() {}
  Schema.prototype = {};
  return {
    Schema,
    model: jest.fn(() => mockCollabRoom),
  };
});

import CollabRoomModel from "../../model/collab-room-model.js";

afterEach(() => jest.clearAllMocks());

/////////////////////////////////////////////////////
// create
/////////////////////////////////////////////////////
describe("CollabRoomModel.create", () => {
  test("calls CollabRoom.create with roomId and questionId, returns the result", async () => {
    const fakeRoom = { roomId: "r1", questionId: "q1" };
    mockCollabRoom.create.mockResolvedValue(fakeRoom);

    const result = await CollabRoomModel.create("r1", "q1");

    expect(mockCollabRoom.create).toHaveBeenCalledWith({
      roomId: "r1",
      questionId: "q1",
    });
    expect(result).toEqual(fakeRoom);
  });

  test("propagates errors from CollabRoom.create", async () => {
    mockCollabRoom.create.mockRejectedValue(new Error("Duplicate key"));
    await expect(CollabRoomModel.create("r1", "q1")).rejects.toThrow(
      "Duplicate key",
    );
  });
});

/////////////////////////////////////////////////////
// findById
/////////////////////////////////////////////////////
describe("CollabRoomModel.findById", () => {
  test("queries by roomId field and returns the document", async () => {
    const fakeRoom = { roomId: "r1", questionId: "q1" };
    mockCollabRoom.findOne.mockResolvedValue(fakeRoom);

    const result = await CollabRoomModel.findById("r1");

    expect(mockCollabRoom.findOne).toHaveBeenCalledWith({ roomId: "r1" });
    expect(result).toEqual(fakeRoom);
  });

  test("returns null when room does not exist", async () => {
    mockCollabRoom.findOne.mockResolvedValue(null);
    const result = await CollabRoomModel.findById("nonexistent");
    expect(result).toBeNull();
  });
});

/////////////////////////////////////////////////////
// addUserToRoom
/////////////////////////////////////////////////////
describe("CollabRoomModel.addUserToRoom", () => {
  test("returns { error: 'Room not found', data: null } when room does not exist", async () => {
    mockCollabRoom.findOne.mockResolvedValue(null);

    const result = await CollabRoomModel.addUserToRoom("r1", { id: "u1" });

    expect(result).toEqual({ error: "Room not found", data: null });
    expect(mockCollabRoom.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("returns { error: 'User already in room', data: null } when user is already in the room (e.g. second tab)", async () => {
    const existingRoom = { roomId: "r1", users: [{ id: "u1" }] };
    mockCollabRoom.findOne.mockResolvedValue(existingRoom);

    const result = await CollabRoomModel.addUserToRoom("r1", { id: "u1" });

    expect(result).toEqual({ error: "User already in room", data: null });
    expect(mockCollabRoom.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("treats two users with undefined ids as duplicates and denies the second", async () => {
    const existingRoom = { roomId: "r1", users: [{ id: undefined }] };
    mockCollabRoom.findOne.mockResolvedValue(existingRoom);

    const result = await CollabRoomModel.addUserToRoom("r1", { id: undefined });

    expect(result).toEqual({ error: "User already in room", data: null });
    expect(mockCollabRoom.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("returns { error: 'Room is full', data: null } when room already has 2 users (third user blocked)", async () => {
    const fullRoom = { roomId: "r1", users: [{ id: "u1" }, { id: "u2" }] };
    mockCollabRoom.findOne.mockResolvedValue(fullRoom);

    const result = await CollabRoomModel.addUserToRoom("r1", { id: "u3" });

    expect(result).toEqual({ error: "Room is full", data: null });
    expect(mockCollabRoom.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("adds user and returns { error: null, data: updatedRoom } when room has capacity", async () => {
    const roomWithOneUser = { roomId: "r1", users: [{ id: "u1" }] };
    const updatedRoom = { roomId: "r1", users: [{ id: "u1" }, { id: "u2" }] };
    mockCollabRoom.findOne.mockResolvedValue(roomWithOneUser);
    mockCollabRoom.findOneAndUpdate.mockResolvedValue(updatedRoom);

    const result = await CollabRoomModel.addUserToRoom("r1", { id: "u2" });

    expect(mockCollabRoom.findOneAndUpdate).toHaveBeenCalledWith(
      { roomId: "r1" },
      { $push: { users: { id: "u2" } } },
      { new: true },
    );
    expect(result).toEqual({ error: null, data: updatedRoom });
  });

  test("first user can always join an empty room", async () => {
    const emptyRoom = { roomId: "r1", users: [] };
    const updatedRoom = { roomId: "r1", users: [{ id: "u1" }] };
    mockCollabRoom.findOne.mockResolvedValue(emptyRoom);
    mockCollabRoom.findOneAndUpdate.mockResolvedValue(updatedRoom);

    const result = await CollabRoomModel.addUserToRoom("r1", { id: "u1" });

    expect(result).toEqual({ error: null, data: updatedRoom });
  });
});

/////////////////////////////////////////////////////
// endRoom
/////////////////////////////////////////////////////
describe("CollabRoomModel.endRoom", () => {
  test("calls findOneAndUpdate with $set endedAt (a Date) and new: true", async () => {
    const updatedRoom = { roomId: "r1", endedAt: new Date() };
    mockCollabRoom.findOneAndUpdate.mockResolvedValue(updatedRoom);

    const result = await CollabRoomModel.endRoom("r1");

    expect(mockCollabRoom.findOneAndUpdate).toHaveBeenCalledWith(
      { roomId: "r1" },
      { $set: { endedAt: expect.any(Date) } },
      { new: true },
    );
    expect(result).toEqual(updatedRoom);
  });

  test("returns null when room does not exist (findOneAndUpdate resolves null)", async () => {
    mockCollabRoom.findOneAndUpdate.mockResolvedValue(null);
    const result = await CollabRoomModel.endRoom("nonexistent");
    expect(result).toBeNull();
  });
});
