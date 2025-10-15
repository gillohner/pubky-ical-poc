import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ExampleCounter } from "../ExampleCounter";
import { useExampleStore } from "@/stores/example-store";

// Reset store before each test
beforeEach(() => {
  useExampleStore.getState().reset();
});

describe("ExampleCounter", () => {
  it("renders the initial count", () => {
    render(<ExampleCounter />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("increments count when increment button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExampleCounter />);

    const incrementButton = screen.getByRole("button", { name: /increment/i });
    await user.click(incrementButton);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("decrements count when decrement button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExampleCounter />);

    const decrementButton = screen.getByRole("button", { name: /decrement/i });
    await user.click(decrementButton);

    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("resets count when reset button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExampleCounter />);

    // Increment a few times
    const incrementButton = screen.getByRole("button", { name: /increment/i });
    await user.click(incrementButton);
    await user.click(incrementButton);

    expect(screen.getByText("2")).toBeInTheDocument();

    // Reset
    const resetButton = screen.getByRole("button", { name: /reset/i });
    await user.click(resetButton);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("displays the message from the store", () => {
    render(<ExampleCounter />);
    expect(screen.getByText("Hello from Zustand!")).toBeInTheDocument();
  });
});
