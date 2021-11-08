/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable sort-imports */
import { Game } from '../../types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CardActionArea from '@mui/material/CardActionArea';
import { Link } from 'react-router-dom';
import { GETuserById } from '../../mock-backend';
import { Button, Grid, TextField } from '@mui/material';
import { Component } from 'react';
import React from 'react';
import { useTheme } from '@mui/styles';

export const SettingsMenu: React.FunctionComponent = () => {
  const user = GETuserById(1);
  const theme = useTheme();

  const [editedUserData, seteditedUserData] = React.useState({
    username: user.username,
    email: user.email,
    // password: user.password,
  });

  const same = (): boolean => {
    return editedUserData.email === user.email && editedUserData.username === user.username;
  };

  return (
    <div className="padded_div">
      <div className="back-button">
        <Button variant="contained" color="primary" href="/gamesUser">
          Back to user profile
        </Button>
      </div>
      <Grid
        container
        spacing={2}
        direction="column"
        justifyContent="center"
        alignItems="center"
        // xs={6}
        style={{ minHeight: '100vh' }}
      >
        <Grid item>
          <Typography variant="h4">Edit user information </Typography>
        </Grid>
        <Grid item>
          <TextField
            label="Email"
            defaultValue={user.email}
            // error={this.state.invalid}
            helperText={editedUserData.email === user.email ? '' : 'Modified'}
            // color={editedUserData.email === user.email ? 'error' : 'error'}
            // color="warning"
            // focused
            onChange={(event) => seteditedUserData({ ...editedUserData, email: event.target.value })}
          ></TextField>
        </Grid>
        <Grid item>
          <TextField
            label="Username"
            defaultValue={user.username}
            // error={this.state.invalid}
            helperText={editedUserData.username === user.username ? '' : 'Modified'}
            onChange={(event) => seteditedUserData({ ...editedUserData, username: event.target.value })}
          ></TextField>
        </Grid>
        <Grid item direction="row" justifyContent="center" alignItems="center">
          <div>
            <Button variant="contained" disabled={same()} color="primary">
              Submit Changes
            </Button>
          </div>
        </Grid>
      </Grid>
      <Grid item justifyContent="flex-end">
        <div></div>
      </Grid>
    </div>
  );
};
