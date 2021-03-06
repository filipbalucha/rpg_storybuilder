import './sidebar.css';
import { ChevronLeft, ChevronRight, ExitToApp } from '@mui/icons-material';
import { useTheme } from '@mui/styles';
import { Drawer, IconButton, Theme } from '@mui/material';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
import PlayerList from '../PlayerList/PlayerList';
import { Tooltip } from '@mui/material';
import Dialog from '../../Dialog/Dialog';
import { useCallback, useState } from 'react';
import { selectIsGameMaster } from '../../../state/slices/userSlice';
import { RootState } from '../../../state/rootReducer';
import { useSelector, useDispatch } from 'react-redux';
import SaveAsRoundedIcon from '@mui/icons-material/SaveAsRounded';
import { updateAllNodes } from '../../../state/slices/gameSlice';
import { clearGame } from '../../../state/slices/gameSlice';

const RightSidebar = (): JSX.Element => {
  const theme = useTheme<Theme>();

  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveGameDialogue, setLeaveGameDialogue] = useState(false);
  const isGameMaster = useSelector((state: RootState) => selectIsGameMaster(state));
  const gameId = useSelector((state: RootState) => state.game.gameInstance._id);

  const toggleSidebarOpen = useCallback(() => {
    setSidebarOpen((prevSidebarOpen: boolean) => !prevSidebarOpen);
  }, []);

  const toggleSettingsOpen = useCallback(() => {
    setSettingsOpen((prevSettingsOpen: boolean) => !prevSettingsOpen);
  }, []);

  return (
    <div className="canvas-sidebar" style={{ backgroundColor: theme.palette.primary.light }}>
      <IconButton
        className="open-close-button"
        style={{
          right: sidebarOpen ? '20%' : '0%',
        }}
        aria-label={`${sidebarOpen ? 'Close' : 'Open'} the sidebar`}
        component="span"
        onClick={toggleSidebarOpen}
      >
        {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
      </IconButton>
      <Drawer anchor="right" className="container" open={sidebarOpen} variant="persistent">
        <Header
          exposeSettings={isGameMaster}
          settingsOpen={isGameMaster && settingsOpen}
          onSettingsToggleClicked={toggleSettingsOpen}
        />
        <PlayerList settingsOpen={isGameMaster && settingsOpen} />
        {isGameMaster && settingsOpen && <Footer />}
      </Drawer>
      <div
        className="top-toolbar"
        style={{
          right: sidebarOpen ? '20%' : '0%',
        }}
      >
        <Tooltip className="first-button" title="Exit game" placement="left">
          <IconButton aria-label="exit game" onClick={() => setLeaveGameDialogue(true)}>
            <ExitToApp />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save game" placement="left">
          <IconButton
            aria-label="save game"
            onClick={() => {
              console.log('saving');
              dispatch(updateAllNodes(gameId));
            }}
          >
            <SaveAsRoundedIcon />
          </IconButton>
        </Tooltip>
      </div>
      <Dialog
        header="Are you sure you wish to exit the game?"
        description="Doing so will redirect you to game overview."
        open={leaveGameDialogue}
        onClose={() => setLeaveGameDialogue(false)}
        onAgree={() => {
          setLeaveGameDialogue(false);
        }}
        onAgreeRedirectTo="/games"
        onDisagree={() => setLeaveGameDialogue(false)}
      />
    </div>
  );
};

export default RightSidebar;
