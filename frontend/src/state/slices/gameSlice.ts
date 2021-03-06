/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch } from 'redux';
import { Game, Node, Subnode, User, UserPermission, UserPermissionRecord } from '../../types';

import { createSlice, createDraftSafeSelector, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import { userGameListDeleteGame, userGameListUpdateImage, userGameListUpdateTitle } from './userSlice';
import nodeManager from '../nodeManager';
import { cloneDeep } from 'lodash';

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
    addNode: (state: GameState, action: PayloadAction<Node>) => {
      state.gameInstance.nodes.push(action.payload);
    },
    deleteNode: (state: GameState, action: PayloadAction<string>) => {
      state.gameInstance.nodes = state.gameInstance.nodes.filter((node) => node._id !== action.payload);
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
    updateGameTitle: (state: GameState, action: PayloadAction<string>) => {
      state.gameInstance.title = action.payload;
    },
    updatePlayerPermission: (state: GameState, action: PayloadAction<[User['_id'], UserPermission, Game['_id']]>) => {
      const [userId, newPermission] = action.payload;
      const user = state.gameInstance.users.find((user) => user.userId === userId);
      if (user) {
        user.permission = newPermission;
      }
    },
    updateGameImage: (state: GameState, action: PayloadAction<Game['image']>) => {
      state.gameInstance.image = action.payload;
    },
    clearGame: (state: GameState) => {
      state.gameInstance = initialState.gameInstance;
    },
  },
});
export default gameSlice.reducer;
export const { gameLoaded, updateDialogStatus, clearGame } = gameSlice.actions;

export const refreshNodes = (): any => {
  const refreshNodesThunk = async (dispatch: Dispatch<any>, getState: () => RootState): Promise<void> => {
    const nodes = getState().game.gameInstance.nodes;
    nodeManager.appendData(nodes);
  };
  return refreshNodesThunk;
};

export const fetchGame = (gameId: Game['_id']): any => {
  const fetchGameThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    console.log('Fetching game');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}`, { credentials: 'include' });
      const game: Game = await response.json();

      switch (response.status) {
        case 200:
          dispatch(gameLoaded(game));
          // TODO: unhook this from the action
          nodeManager.appendData(game.nodes);
          break;
        default:
          // TODO: handle in UI
          console.error(`Could not fetch game ${gameId}`, response);
      }
    } catch (err) {
      console.error(`Could not fetch game ${gameId}`, err);
    }
  };
  return fetchGameThunk;
};

export const deleteGame = (): any => {
  const deleteGameThunk = async (dispatch: Dispatch<any>, getState: () => RootState): Promise<void> => {
    try {
      const gameId = getState().game.gameInstance._id;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}`, {
        credentials: 'include',
        method: 'DELETE',
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.clearGame());
          dispatch(userGameListDeleteGame(gameId));
          break;
        default:
          console.log('Could not delete node', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not delete node');
    }
  };
  return deleteGameThunk;
};

export const addPlayer = (user: string, gameId: Game['_id']): any => {
  const addPlayerThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}/user/${user}`, {
        method: 'POST',
        credentials: 'include',
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
      console.error(`Could not add user ${user} to game`);
    }
  };
  return addPlayerThunk;
};

export const updateGameImage = (image: string): any => {
  const updateGameImageThunk = async (dispatch: Dispatch<any>, getState: () => RootState): Promise<void> => {
    const gameId = getState().game.gameInstance._id;
    try {
      const update: Partial<Game> = { image };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.updateGameImage(image));
          dispatch(userGameListUpdateImage([gameId, image]));
          break;
        default:
          console.error('Could not update game image.');
          break;
      }
    } catch {
      console.error('Could not update game image.');
    }
  };
  return updateGameImageThunk;
};

// TODO: test
export const removePlayer = (playerId: User['_id'], gameId: Game['_id']): any => {
  const removePlayerThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}/user/${playerId}`, {
        method: 'DELETE',
        credentials: 'include',
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

export const addDefaultNode = (gameId: Game['_id']): any => {
  const addNodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/node/${gameId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const node: Node = await response.json();
      switch (response.status) {
        case 200:
          nodeManager.addNode(node);
          dispatch(gameSlice.actions.addNode(node));
          break;
        default:
          console.log('Could not add node', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not add node');
    }
  };
  return addNodeThunk;
};

export const deleteNode = (gameId: Game['_id'], nodeId: Node['_id']): any => {
  const deleteNodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/node/${gameId}/${nodeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      switch (response.status) {
        case 200:
          nodeManager.deleteNode(nodeId);
          dispatch(gameSlice.actions.deleteNode(nodeId));
          break;
        default:
          console.log('Could not delete node', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not delete node');
    }
  };
  return deleteNodeThunk;
};

export const updateNode = (gameId: Game['_id'], node: Node): any => {
  const updateNodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/node/${gameId}/${node._id}`, {
        method: 'PATCH',
        body: JSON.stringify(node),
        credentials: 'include',
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
  };
  return updateNodeThunk;
};

export const updateAllNodes = (gameId: Game['_id']): any => {
  const updateAllNodesThunk = async (dispatch: Dispatch<any>, getState: () => RootState): Promise<void> => {
    console.log(`attempting to save all nodes`);

    // TODO Improve implementation of this function

    const snapshot = nodeManager.getSnapshot();
    const allCanvasNodes = snapshot.allNodes;
    const allNodes = getState().game.gameInstance.nodes;

    try {
      allNodes.forEach(async (node, index) => {
        if (
          node.x != allCanvasNodes[index].x - snapshot.finalX ||
          node.y != allCanvasNodes[index].y - snapshot.finalY
        ) {
          const nodeCopy = cloneDeep(node);
          nodeCopy.x = allCanvasNodes[index].x + snapshot.finalX;
          nodeCopy.y = allCanvasNodes[index].y + snapshot.finalY;

          const response = await fetch(`${process.env.REACT_APP_API_URL}/node/${gameId}/${nodeCopy._id}`, {
            method: 'PATCH',
            body: JSON.stringify(nodeCopy),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          switch (response.status) {
            case 200:
              dispatch(gameSlice.actions.updateNode(nodeCopy));
              break;
            default:
              console.log('Could not update node', response);
              break;
          }
        }
      });

      console.log(`saved`);
    } catch (e) {
      console.log(e, 'Could not update node');
    }
  };
  return updateAllNodesThunk;
};

// TODO: maybe use PUT instead of PATCH for this (nbd)
export const updateSubnode = (gameId: Game['_id'], nodeId: Node['_id'], subnode: Subnode): any => {
  const updateSubnodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subnode/${gameId}/${nodeId}/${subnode._id}`, {
        method: 'PATCH',
        body: JSON.stringify(subnode),
        credentials: 'include',
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

export const addSubnode = (gameId: Game['_id'], nodeId: Node['_id'], subnode: Partial<Subnode>): any => {
  const addSubnodeThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subnode/${gameId}/${nodeId}`, {
        method: 'POST',
        body: JSON.stringify(subnode),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const newSubnode: Subnode = await response.json();
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.addSubnode([nodeId, newSubnode]));
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

export const updateGameTitle = (gameId: Game['_id'], newTitle: string): any => {
  const updateGameTitleThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${gameId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: newTitle,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      switch (response.status) {
        case 200:
          dispatch(gameSlice.actions.updateGameTitle(newTitle));
          dispatch(userGameListUpdateTitle([gameId, newTitle]));
          break;
        default:
          console.log('Could not set game title', response);
          break;
      }
    } catch (e) {
      console.log(e, 'Could not update game title');
    }
  };
  return updateGameTitleThunk;
};

export const updatePlayerPermission = (payload: [User['_id'], UserPermission, Game['_id']]): any => {
  const updatePlayerPermissionThunk = async (dispatch: Dispatch<any>): Promise<void> => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/game/${payload[2]}/user/${payload[0]}`, {
        method: 'PATCH',
        body: JSON.stringify({ permission: payload[1] }),
        credentials: 'include',
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
      const match = node.informationLevels.find((i) => i.user === user._id);
      return (match && match.infoLevel > 0) || node.editors.includes(user._id);
    });
  },
);

export const selectActiveNode: any = createDraftSafeSelector(
  (state: RootState): Node[] => state.game.gameInstance.nodes,
  (state: RootState): string => state.nodeview.activeNode, // this seems bad to do
  (nodes: Node[], activeNodeId: string): Node => {
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
