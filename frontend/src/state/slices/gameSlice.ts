/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch } from 'redux';
import { Game, Node, Subnode, User, UserPermission, UserPermissionRecord } from '../../types';

import { createSlice, createDraftSafeSelector, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';

export enum GameLoadingStatus {
  Loading,
  Idle,
}

export type GameDialog = 'userAlreadyAdded' | 'userNotFound';
interface GameState {
  gameInstance: Game;
  status: GameLoadingStatus;
  dialogStatus: { [key in GameDialog]: boolean };
}

const initialState: GameState = {
  gameInstance: {} as Game, // TODO: get rid of this hack by treating the "undefined" case, too
  status: GameLoadingStatus.Loading,
  dialogStatus: {
    userAlreadyAdded: false,
    userNotFound: false,
  },
};

// Reducer
const gameSlice = createSlice({
  name: 'game',
  initialState: initialState,
  reducers: {
    addPlayer: (state: GameState, action: PayloadAction<UserPermissionRecord>) => {
      state.gameInstance.users.push(action.payload);
    },
    removePlayer: (state: GameState, action: PayloadAction<User['_id']>) => {
      const idToRemove = action.payload;
      state.gameInstance.users = state.gameInstance.users.filter((user) => user.userId !== idToRemove);
    },
    updateDialogStatus: (state: GameState, action: PayloadAction<[GameDialog, boolean]>) => {
      const [dialog, status] = action.payload;
      state.dialogStatus[dialog] = status;
    },
    gameLoaded: (state: GameState, action: PayloadAction<Game>) => {
      state.gameInstance = action.payload;
      state.status = GameLoadingStatus.Idle;
    },
    updateNode: (state: GameState, action: PayloadAction<Node>) => {
      const index = state.gameInstance.nodes.findIndex((node) => node._id === action.payload._id);
      state.gameInstance.nodes[index] = action.payload;
    },
    updateSubnode: (state: GameState, action: PayloadAction<[Node['_id'], Subnode]>) => {
      const nodeToUpdate = state.gameInstance.nodes.find((node) => node._id === action.payload[0]) as Node;
      const index = nodeToUpdate.subnodes.findIndex((subnode) => subnode._id === action.payload[1]._id);
      nodeToUpdate.subnodes[index] = action.payload[1];
    },
    addSubnode: (state: GameState, action: PayloadAction<[Node['_id'], Subnode]>) => {
      const nodeToUpdate = state.gameInstance.nodes.find((node) => node._id === action.payload[0]) as Node;
      nodeToUpdate.subnodes.push(action.payload[1]);
    },
    setGameTitle: (state: GameState, action: PayloadAction<string>) => {
      state.gameInstance.title = action.payload;
    },
    updatePlayerPermission: (state: GameState, action: PayloadAction<[User['_id'], UserPermission, Game['_id']]>) => {
      const [userId, newPermission] = action.payload;
      const user = state.gameInstance.users.find((user) => user.userId === userId);
      if (user) {
        user.permission = newPermission;
      }
    },
  },
});
export default gameSlice.reducer;
export const { gameLoaded, updateDialogStatus } = gameSlice.actions;

export const fetchGame = (gameId: Game['_id']): any => {
  const fetchGameThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    console.log('Fetching game');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}`);
      const game: Game = await response.json();

      switch (response.status) {
        case 200:
          dispatch(gameLoaded(game));
          break;
        default:
          // TODO: handle in UI
          console.error(`Could not fetch game ${gameId}`);
      }
    } catch {
      console.error(`Could not fetch game ${gameId}`);
    }
  };
  return fetchGameThunk;
};

export const addPlayer = (user: User, gameId: Game['_id']): any => {
  const addPlayerThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}/user/${user._id}`, {
        method: 'POST',
      });
      switch (response.status) {
        case 200:
          const record: UserPermissionRecord = await response.json();
          dispatch(gameSlice.actions.addPlayer(record));
          break;
        case 404:
          dispatch(gameSlice.actions.updateDialogStatus(['userNotFound', true]));
          break;
        case 422:
          dispatch(gameSlice.actions.updateDialogStatus(['userAlreadyAdded', true]));
          break;
      }
    } catch {
      console.error(`Could not add user ${user.username} to game`);
    }
  };
  return addPlayerThunk;
};

// TODO: test
export const removePlayer = (playerId: User['_id'], gameId: Game['_id']): any => {
  const removePlayerThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}/user/${playerId}`, {
        method: 'DELETE',
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.removePlayer(playerId));
          break;
        default:
          console.error(`Could not remove player ${playerId} from the game.`);
          break;
      }
    } catch {
      console.error(`Could not remove player ${playerId} from the game.`);
    }
  };
  return removePlayerThunk;
};

export const updateNode = (gameId: Game['_id'], node: Node): any => {
  const updateNodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/node/${gameId}/${node._id}`, {
        method: 'PATCH',
        body: JSON.stringify(node),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.updateNode(node));
          break;
        default:
          console.log('Could not update node', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not update node');
    }
    dispatch(gameSlice.actions.updateNode(node));
  };
  return updateNodeThunk;
};

// TODO: maybe use PUT instead of PATCH for this (nbd)
export const updateSubnode = (gameId: Game['_id'], nodeId: Node['_id'], subnode: Subnode): any => {
  const updateSubnodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subnode/${gameId}/${nodeId}/${subnode._id}`, {
        method: 'PATCH',
        body: JSON.stringify(subnode),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.updateSubnode([nodeId, subnode]));
          break;
        default:
          console.log('Could not update subnode', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not update subnode');
    }
  };
  return updateSubnodeThunk;
};

export const addSubnode = (gameId: Game['_id'], nodeId: Node['_id'], subnode: Subnode): any => {
  const addSubnodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subnode/${gameId}/${nodeId}`, {
        method: 'POST',
        body: JSON.stringify(subnode),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.addSubnode([nodeId, subnode]));
          break;
        default:
          console.log('Could not add subnode', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not add subnode');
    }
  };
  return addSubnodeThunk;
};

export const setGameTitle = (gameId: Game['_id'], newTitle: string): any => {
  const setGameTitleThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: newTitle,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.setGameTitle(newTitle));
          break;
        default:
          console.log('Could not set game title', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not update game title');
    }
  };
  return setGameTitleThunk;
};

export const updatePlayerPermission = (payload: [User['_id'], UserPermission, Game['_id']]): any => {
  const updatePlayerPermissionThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${payload[2]}/user/${payload[0]}}`, {
        method: 'PATCH',
        body: JSON.stringify({ permission: payload[1] }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.updatePlayerPermission(payload));
          break;
        default:
          console.log('Could not update player permission', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not update player permission');
    }
  };
  return updatePlayerPermissionThunk;
};

export const selectVisibleNodes: any = createDraftSafeSelector(
  (state: RootState): Game => state.game.gameInstance,
  (state: RootState): User => state.user.userInstance,
  (game: Game, user: User): Node[] => {
    return game.nodes.filter((node) => {
      const match = node.informationLevels.find((i) => i.userId === user._id);
      return match && match.infoLevel > 0;
    });
  },
);

export const selectActiveNode: any = createDraftSafeSelector(
  (state: RootState): Node[] => state.game.gameInstance.nodes,
  (state: RootState): string => state.nodeview.activeNode, // this seems bad to do
  (nodes: Node[], activeNodeId: string): Node => {
    console.log(nodes);
    return nodes.find((node) => node._id === activeNodeId) as Node;
  },
);

export const selectUserIds: any = createDraftSafeSelector(
  (state: RootState): Game => state.game.gameInstance,
  (game: Game) => game.users.map((record) => record.userId),
);

export const selectGameMasterIds: any = createDraftSafeSelector(
  (state: RootState): Game => state.game.gameInstance,
  (game: Game): User['_id'][] => {
    const gameMasterIds = game.users
      .filter((i) => i.permission === UserPermission.gameMaster)
      .map((record) => record.userId);
    return gameMasterIds;
  },
);
