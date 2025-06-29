import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { SoundProvider } from "../contexts/SoundContext";
import { ModalProvider } from "../contexts/ModalContext";
import Login from "../pages/Login";

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInAnonymously: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firebase config
jest.mock("../firebase/config", () => ({
  auth: {},
  db: {},
  getBasePath: () => "test",
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <SoundProvider>
      <ModalProvider>
        <AuthProvider>{children}</AuthProvider>
      </ModalProvider>
    </SoundProvider>
  </BrowserRouter>
);

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login form correctly", () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText("KidQuest Champions")).toBeInTheDocument();
    expect(
      screen.getByText("Begin Your Legendary Adventure")
    ).toBeInTheDocument();
    expect(screen.getByText("Choose Your Portal")).toBeInTheDocument();
  });

  test("validates email format", async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Click on email/password login button first
    const emailLoginButton = screen.getByText(/Sign In with Email/i);
    fireEvent.click(emailLoginButton);

    // Enter invalid email
    const emailInput = screen.getByPlaceholderText("Email");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByText(/Enter the Portal/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid email address/i)
      ).toBeInTheDocument();
    });
  });

  test("validates password length for sign up", async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Switch to sign up mode
    const signUpButton = screen.getByText(/Create New Account/i);
    fireEvent.click(signUpButton);

    // Enter valid email but short password
    const emailInput = screen.getByPlaceholderText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(passwordInput, { target: { value: "123" } });

    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    fireEvent.change(confirmPasswordInput, { target: { value: "123" } });

    const submitButton = screen.getByText(/Create Account/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 6 characters long/i)
      ).toBeInTheDocument();
    });
  });

  test("validates password confirmation for sign up", async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Switch to sign up mode
    const signUpButton = screen.getByText(/Create New Account/i);
    fireEvent.click(signUpButton);

    // Enter mismatched passwords
    const emailInput = screen.getByPlaceholderText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    fireEvent.change(confirmPasswordInput, {
      target: { value: "differentpassword" },
    });

    const submitButton = screen.getByText(/Create Account/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  test("shows forgot password form", () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const forgotPasswordLink = screen.getByText(/Forgot Password?/i);
    fireEvent.click(forgotPasswordLink);

    expect(screen.getByText("Reset Your Password")).toBeInTheDocument();
    expect(
      screen.getByText(/Enter your email address and we'll send you a link/i)
    ).toBeInTheDocument();
  });

  test("validates email for password reset", async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Switch to forgot password mode
    const forgotPasswordLink = screen.getByText(/Forgot Password?/i);
    fireEvent.click(forgotPasswordLink);

    // Try to submit without email
    const resetButton = screen.getByText(/Send Reset Email/i);
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter your email address/i)
      ).toBeInTheDocument();
    });
  });

  test("has anonymous login option", () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText(/Continue as Guest/i)).toBeInTheDocument();
  });

  test("has Google sign-in option", () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
  });

  test("shows loading state when authentication is in progress", async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Mock loading state by clicking anonymous login
    const anonymousButton = screen.getByText(/Continue as Guest/i);
    fireEvent.click(anonymousButton);

    // Check for loading indicators (this will depend on implementation)
    await waitFor(() => {
      expect(anonymousButton).toBeDisabled();
    });
  });

  test("toggles between sign in and sign up modes", () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Initially in sign in mode
    expect(screen.getByText("Choose Your Portal")).toBeInTheDocument();

    // Switch to sign up
    const signUpButton = screen.getByText(/Create New Account/i);
    fireEvent.click(signUpButton);

    expect(
      screen.getByText("Create Your Champion Account")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();

    // Switch back to sign in
    const signInButton = screen.getByText(/Already have an account?/i);
    fireEvent.click(signInButton);

    expect(screen.getByText("Choose Your Portal")).toBeInTheDocument();
  });
});
