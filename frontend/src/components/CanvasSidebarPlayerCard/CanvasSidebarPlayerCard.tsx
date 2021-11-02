import './canvasSidebarPlayerCard.css';
import { Avatar, IconButton, Tooltip } from '@mui/material';
import { Person, PersonOutline, PersonRemove } from '@mui/icons-material';
import { PureComponent } from 'react';
import { User } from '../../types';

interface Props {
  isAdmin: boolean;
  promotable: boolean;
  removable: boolean;
  user: User;
  onRemovePlayerClicked: (user: User) => void;
  onPromotePlayerClicked: (id: number) => void;
  onDemotePlayerClicked: (id: number) => void;
}

export default class CanvasSidebarPlayerCard extends PureComponent<Props> {
  render(): JSX.Element {
    const { isAdmin, promotable, removable, user } = this.props;
    return (
      <div className="canvas-sidebar-player-card">
        <Tooltip arrow placement="left" title={promotable ? 'Promote to game master' : 'Demote to regular player'}>
          <IconButton
            aria-label={
              promotable
                ? `Promote player ${user.username} to game master`
                : `Demote game master ${user.username} to regular player`
            }
            component="span"
            disabled={!isAdmin}
            onClick={() =>
              promotable ? this.props.onPromotePlayerClicked(user.id) : this.props.onDemotePlayerClicked(user.id)
            }
          >
            {promotable ? <PersonOutline /> : <Person />}
          </IconButton>
        </Tooltip>
        <Avatar alt={user.username} src={user.profilePicture}>
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
        <div className="canvas-sidebar-player-card__name">{`@${user.username}`}</div>
        {isAdmin && removable && (
          <div className="canvas-sidebar-player-card__button">
            <Tooltip arrow placement="left" title="Remove player">
              <IconButton
                aria-label="Remove player"
                component="span"
                onClick={() => this.props.onRemovePlayerClicked(user)}
              >
                <PersonRemove />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
}
