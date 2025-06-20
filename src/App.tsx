import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";

const stats = [
  {
    title: "Users",
    value: 1200,
    icon: <PeopleIcon fontSize="large" className="text-blue-500" />,
  },
  {
    title: "Orders",
    value: 305,
    icon: <ShoppingCartIcon fontSize="large" className="text-green-500" />,
  },
  {
    title: "Revenue",
    value: "$15,300",
    icon: <BarChartIcon fontSize="large" className="text-purple-500" />,
  },
];

const App: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-8 text-blue-600">Admin Panel</h2>
        <nav className="flex flex-col space-y-4 text-gray-700">
          <a href="#" className="hover:text-blue-600">
            Dashboard
          </a>
          <a href="#" className="hover:text-blue-600">
            Users
          </a>
          <a href="#" className="hover:text-blue-600">
            Orders
          </a>
          <a href="#" className="hover:text-blue-600">
            Reports
          </a>
          <a href="#" className="hover:text-blue-600">
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* AppBar */}
        <AppBar position="static" color="primary" elevation={3}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Admin Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Stats cards */}
        <main className="p-6 flex-1 overflow-auto">
          <Grid container spacing={4}>
            {stats.map(({ title, value, icon }) => (
              <Grid item xs={12} sm={6} md={4} key={title}>
                <Card
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: 2,
                    boxShadow: 3,
                  }}
                >
                  <div className="mr-4">{icon}</div>
                  <CardContent>
                    <Typography variant="h5" component="div" fontWeight="bold">
                      {value}
                    </Typography>
                    <Typography color="text.secondary">{title}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </main>
      </div>
    </div>
  );
};

export default App;
