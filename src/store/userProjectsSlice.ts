import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  _id: string;
  name: string;
}

interface UserProjectsState {
  projects: Project[];
}

const initialState: UserProjectsState = {
  projects: [],
};

const userProjectsSlice = createSlice({
  name: 'userProjects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
    },
    addProject(state, action: PayloadAction<Project>) {
      state.projects.push(action.payload);
    },
  },
});

export const { setProjects, addProject } = userProjectsSlice.actions;

export default userProjectsSlice.reducer;
