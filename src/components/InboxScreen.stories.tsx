import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";
import { waitFor, waitForElementToBeRemoved } from "storybook/test";
import { MockedState } from "./TaskList.stories";

import { Provider } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";

import InboxScreen from "./InboxScreen";

import store from "../lib/store";

// A mock store for docs view that doesn't rely on network requests
const MockStore = ({
  taskboxState,
  children,
}: {
  taskboxState: typeof MockedState;
  children: React.ReactNode;
}) => (
  <Provider
    store={configureStore({
      reducer: {
        taskbox: createSlice({
          name: "taskbox",
          initialState: taskboxState,
          reducers: {
            updateTaskState: (state, action) => {
              const { id, newTaskState } = action.payload;
              const task = state.tasks.findIndex((task) => task.id === id);
              if (task >= 0) {
                state.tasks[task].state = newTaskState;
              }
            },
          },
        }).reducer,
      },
    })}
  >
    {children}
  </Provider>
);

const meta = {
  component: InboxScreen,
  title: "InboxScreen",
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  tags: ["autodocs"],
  parameters: {
    docs: {
      story: { inline: true },
    },
  },
} satisfies Meta<typeof InboxScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (story) => <MockStore taskboxState={MockedState}>{story()}</MockStore>,
  ],
};

export const WithInteractions: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.typicode.com/todos?userId=1", () => {
          return HttpResponse.json(MockedState.tasks);
        }),
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    // Waits for the component to transition from the loading state
    await waitForElementToBeRemoved(await canvas.findByTestId("loading"));
    // Waits for the component to be updated based on the store
    await waitFor(async () => {
      // Simulates pinning the first task
      await userEvent.click(canvas.getByLabelText("pinTask-1"));
      // Simulates pinning the third task
      await userEvent.click(canvas.getByLabelText("pinTask-3"));
    });
  },
};

export const Error: Story = {
  decorators: [
    (story) => (
      <MockStore
        taskboxState={{
          ...MockedState,
          error: "Something went wrong",
        }}
      >
        {story()}
      </MockStore>
    ),
  ],
};
