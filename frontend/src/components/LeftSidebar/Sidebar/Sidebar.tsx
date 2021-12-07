import './sidebar.css';
import React from 'react';
import NodeCard from '../NodeCard/NodeCard';
import { Drawer, IconButton, Tooltip, Typography } from '@mui/material';
import { ExitToApp, Add, CenterFocusStrong, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { withTheme } from '@emotion/react';
import { MuiTheme } from '../../../theme';
import Dialog from '../../Dialog/Dialog';
import { useSelector } from 'react-redux';
import { RootState } from '../../../state/rootReducer';
import { Node } from '../../../types';
import { addDefaultNode } from '../../../state/slices/gameSlice';
import { store } from '../../../state/';
import { setIsEditPermissionsModalOpen } from '../../../state/slices/nodeviewSlice';
import nodeManager from '../../../state/nodeManager';

type Props = MuiTheme;

const Sidebar = (props: Props): JSX.Element => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [leaveGameDialogue, setLeaveGameDialogue] = React.useState(false);
  const allNodes = useSelector((state: RootState) => state.game.gameInstance.nodes);
  const gameId = useSelector((state: RootState) => state.game.gameInstance._id);
  const isAdmin = useSelector((state: RootState) => {
    const allusers = state.game.gameInstance.users;
    const thisUser = state.user.userInstance;
    return allusers.some((user) => user.permission === 0 && thisUser._id === user.userId);
  });

  const sortNodes = (allNodes: Node[]): Node[] => {
    return [...allNodes].sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <div className="left-sidebar">
      <Drawer className="container" anchor="left" open={isOpen} variant="persistent">
        <div className="header" style={{ backgroundColor: props.theme.palette.primary.light }}>
          <Typography className="title" variant="h6" component="div" align="center" noWrap={true}>
            Node Overview
          </Typography>
        </div>
        <div className="node-list">
          {sortNodes(allNodes).map((node: Node) => (
            <NodeCard key={node._id} node={node} />
          ))}
        </div>
      </Drawer>
      <div
        className="top-toolbar"
        style={{
          left: isOpen ? '20%' : '0%',
        }}
      >
        <Tooltip title="Center node view" placement="right">
          <IconButton aria-label="Center node view" onClick={() => nodeManager.centerCanvas()}>
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add a new node" placement="right">
          <IconButton
            aria-label="Add a new node"
            onClick={() => {
              if (isAdmin) store.dispatch(addDefaultNode(gameId));
              else store.dispatch(setIsEditPermissionsModalOpen(true));
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
        {/*<Tooltip className="first-button" title="Leave game" placement="right">
          <IconButton aria-label="Lave game" onClick={() => setLeaveGameDialogue(true)}>
            <ExitToApp />
          </IconButton>
      </Tooltip>*/}
      </div>
      <div
        className="bottom-toolbar"
        style={{
          left: isOpen ? '20%' : '0%',
        }}
      >
        <IconButton aria-label={`${isOpen ? 'Close' : 'Open'} the sidebar`} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </div>
      <Dialog
        header="Are you sure you wish to leave the game?"
        description="Doing so will redirect you to game overview."
        open={leaveGameDialogue}
        onClose={() => setLeaveGameDialogue(false)}
        onAgree={() => setLeaveGameDialogue(false)}
        onAgreeRedirectTo="/games"
        onDisagree={() => setLeaveGameDialogue(false)}
      />
    </div>
  );
};

export default withTheme(Sidebar);
