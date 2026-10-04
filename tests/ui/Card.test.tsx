import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

describe("Card Components", () => {
  it("renders Card with children", () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    );
    expect(screen.getByText("Card content")).toBeInTheDocument();
    expect(screen.getByText("Card content").closest("div")).toHaveClass("rounded-xl");
  });

  it("renders CardHeader with title and description", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card description")).toBeInTheDocument();
    expect(screen.getByText("Card Title")).toHaveClass("font-display");
  });

  it("renders CardFooter", () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText("Footer content")).toBeInTheDocument();
    expect(screen.getByText("Footer content").closest("div")).toHaveClass("flex");
  });

  it("applies custom className", () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText("Content").closest("div")).toHaveClass("custom-class");
  });

  it("renders CardTitle with correct heading level", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title");
  });

  it("renders CardDescription with muted color", () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("Description")).toHaveClass("text-muted-foreground");
  });
});