import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/Card';

describe('Card Accessibility', () => {
  it('should not have any accessibility violations with basic card', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with full card structure', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This card has all sections</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content area</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with minimal card', async () => {
    const { container } = render(
      <Card>
        <CardContent>
          <p>Simple card with just content</p>
        </CardContent>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with interactive card', async () => {
    const { container } = render(
      <Card role="button" tabIndex={0}>
        <CardHeader>
          <CardTitle>Clickable Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This card is interactive</p>
        </CardContent>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with form card', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Form Card</CardTitle>
          <CardDescription>Please fill out the form</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <label htmlFor="name">Name:</label>
            <input id="name" type="text" />
          </form>
        </CardContent>
        <CardFooter>
          <button type="submit">Submit</button>
        </CardFooter>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
