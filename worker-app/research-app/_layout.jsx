import React from 'react';
import {Stack} from 'expo-router';
// Independent research root: no project AuthProvider, sockets, analytics or account login.
export default function ResearchLayout(){return <Stack screenOptions={{headerShown:false}}/>;}
