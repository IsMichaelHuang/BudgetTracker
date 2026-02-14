import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { verifyAuthToken } from "../middleware/auth.middleware";

describe("Auth Middleware - verifyAuthToken", () => {
    const JWT_SECRET = process.env.JWT_SECRET!;
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
        mockReq = {
            get: vi.fn(),
            app: { locals: { JWT_SECRET } },
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        mockNext = vi.fn();
    });

    it("returns 401 when no Authorization header is present", () => {
        mockReq.get.mockReturnValue("");

        verifyAuthToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "No token provided" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when Authorization header has no Bearer prefix", () => {
        mockReq.get.mockReturnValue("Basic some-token");

        verifyAuthToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "No token provided" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when token is invalid", () => {
        mockReq.get.mockReturnValue("Bearer invalid-token-value");

        verifyAuthToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when token is expired", () => {
        const expiredToken = jwt.sign(
            { id: "abc123", username: "testuser" },
            JWT_SECRET,
            { expiresIn: "-1h" }
        );
        mockReq.get.mockReturnValue(`Bearer ${expiredToken}`);

        verifyAuthToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when token is signed with wrong secret", () => {
        const wrongSecretToken = jwt.sign(
            { id: "abc123", username: "testuser" },
            "wrong-secret",
            { expiresIn: "2h" }
        );
        mockReq.get.mockReturnValue(`Bearer ${wrongSecretToken}`);

        verifyAuthToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("attaches user to request and calls next() with valid token", () => {
        const token = jwt.sign(
            { id: "abc123", username: "testuser" },
            JWT_SECRET,
            { expiresIn: "2h" }
        );
        mockReq.get.mockReturnValue(`Bearer ${token}`);

        verifyAuthToken(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toBeDefined();
        expect(mockReq.user.id).toBe("abc123");
        expect(mockReq.user.username).toBe("testuser");
        expect(mockRes.status).not.toHaveBeenCalled();
    });
});
