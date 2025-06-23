import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  useTheme,
  Skeleton,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Restaurant,
  Event,
  People,
  Category,
  Assignment,
  Add,
  Edit,
  Check,
  Delete,
  CalendarToday,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import {
  categoryService,
  itemService,
  addonService,
  eventService,
  adminService,
  operationHourService,
} from "../services/api";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  change?: string;
  loading?: boolean;
  isPositive?: boolean;
  trend?: number[];
}

interface DashboardStats {
  categories: number;
  items: number;
  addons: number;
  events: number;
  admins: number;
  operationHours: number;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  description?: string;
  dueDate?: Date;
  createdAt: Date;
}

interface DashboardEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
  loading = false,
  isPositive = true,
  trend,
}) => {
  const theme = useTheme();

  // Simple trend line generator
  const generateTrendPath = (data: number[]) => {
    if (!data || data.length < 2) return '';
    
    const width = 80;
    const height = 30;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - minVal) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        sx={{
          height: "100%",
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          border: `1px solid ${color}25`,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          "&:hover": {
            boxShadow: `0 8px 32px ${color}25`,
            "&::before": {
              opacity: 1,
            },
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
            opacity: 0.7,
            transition: "opacity 0.3s ease",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              {loading ? (
                <>
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="40%" height={16} />
                </>
              ) : (
                <>                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: color,
                      mb: 1,
                      lineHeight: 1,
                    }}
                  >
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      mb: 1,
                    }}
                  >
                    {title}
                  </Typography>
                  {change && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isPositive ? (
                        <KeyboardArrowUp sx={{ color: 'success.main', fontSize: 18 }} />
                      ) : (
                        <KeyboardArrowDown sx={{ color: 'error.main', fontSize: 18 }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: isPositive ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {change}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: `${color}20`,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </Box>
              
              {/* Mini trend chart */}
              {trend && trend.length > 1 && !loading && (
                <Box sx={{ mt: 1 }}>
                  <svg width="80" height="30" viewBox="0 0 80 30">
                    <path
                      d={generateTrendPath(trend)}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {trend.map((_, i) => (
                      <circle
                        key={i}
                        cx={(i / (trend.length - 1)) * 80}
                        cy={30 - ((trend[i] - Math.min(...trend)) / (Math.max(...trend) - Math.min(...trend) || 1)) * 30}
                        r="2"
                        fill={color}
                      />
                    ))}
                  </svg>
                </Box>
              )}
            </Box>          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const DashboardView: React.FC = () => {
  const theme = useTheme();
  const [calendarDate, setCalendarDate] = useState<Date | null>(new Date());
  const [eventDates, setEventDates] = useState<Date[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    categories: 0,
    items: 0,
    addons: 0,
    events: 0,
    admins: 0,
    operationHours: 0,
  });
  const [loading, setLoading] = useState(true);  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<DashboardEvent[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchUpcomingEvents();
    fetchTasks();
  }, []);  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel using count endpoints with individual error handling
      const results = await Promise.allSettled([
        categoryService.getCount(),
        itemService.getCount(),
        addonService.getCount(),
        eventService.getCount(),
        adminService.getCount(),
        operationHourService.getCount(),
      ]);

      const getCountValue = (result: PromiseSettledResult<any>): number => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (typeof value === 'object' && value !== null) {
            return value.count || 0;
          }
          return Number(value) || 0;
        }
        return 0;
      };

      setStats({
        categories: getCountValue(results[0]),
        items: getCountValue(results[1]),
        addons: getCountValue(results[2]),
        events: getCountValue(results[3]),
        admins: getCountValue(results[4]),
        operationHours: getCountValue(results[5]),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set default values on error
      setStats({
        categories: 0,
        items: 0,
        addons: 0,
        events: 0,
        admins: 0,
        operationHours: 0,
      });
    } finally {
      setLoading(false);
    }
  };  const fetchUpcomingEvents = async () => {
    try {
      const response = await eventService.getAll(1, 50); // Get more events for calendar
      const events = response?.data || [];
      
      // Extract event dates for calendar highlighting
      const dates = events.map((event: any) => new Date(event.start_date));
      setEventDates(dates);
      
      const now = new Date();
      const upcoming = events.filter((event: any) => 
        event && event.start_date && new Date(event.start_date) >= now
      ).slice(0, 5);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      setUpcomingEvents([]);
      setEventDates([]);
    }
  };  // Custom day component for highlighting events
  const CustomDay = (props: PickersDayProps) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dayEvents = upcomingEvents.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      return day >= eventStart && day <= eventEnd;
    });
    
    const hasEvent = dayEvents.length > 0;

    if (outsideCurrentMonth) {
      return <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />;
    }

    const handleEventIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasEvent) {
        setSelectedDateEvents(dayEvents);
        setEventDialogOpen(true);
      }
    };

    const tooltipTitle = hasEvent 
      ? `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}: ${dayEvents.map(e => e.name).join(', ')}`
      : '';

    return (
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Box position="relative" display="inline-block">          <PickersDay
            {...other}
            day={day}
            outsideCurrentMonth={outsideCurrentMonth}
            sx={{
              ...(hasEvent && {
                background: `linear-gradient(135deg, ${theme.palette.primary.light}60, ${theme.palette.primary.main}40)`,
                color: theme.palette.primary.dark,
                fontWeight: 700,
                border: `2px solid ${theme.palette.primary.main}60`,
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}80, ${theme.palette.primary.main}60)`,
                  transform: 'scale(1.05)',
                  boxShadow: `0 4px 20px ${theme.palette.primary.main}40`,
                },
              }),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'visible',
            }}
          />
          {hasEvent && (
            <Box
              onClick={handleEventIconClick}
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '2px solid white',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 1,
                transform: 'scale(0.9)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  background: `linear-gradient(45deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
                },
              }}
            >
              {dayEvents.length}
            </Box>
          )}
        </Box>
      </Tooltip>
    );
  };const fetchTasks = async () => {
    try {
      // In a real app, you'd fetch from an API
      // For now, using local storage
      const savedTasks = localStorage.getItem('dashboard_tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);
      } else {
        // Default tasks
        const defaultTasks: Task[] = [
          {
            id: "1",
            title: "Review new menu items",
            completed: false,
            priority: "high",
            description: "Check and approve new seasonal menu items",
            createdAt: new Date(),
          },
          {
            id: "2",
            title: "Update operation hours",
            completed: false,
            priority: "medium",
            description: "Update restaurant hours for holiday season",
            createdAt: new Date(),
          },
        ];
        setTasks(defaultTasks);
        localStorage.setItem('dashboard_tasks', JSON.stringify(defaultTasks));
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    }
  };

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('dashboard_tasks', JSON.stringify(updatedTasks));
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        priority: newTaskPriority,
        createdAt: new Date(),
      };
      const updatedTasks = [task, ...tasks];
      saveTasks(updatedTasks);
      setNewTask('');
      setTaskDialogOpen(false);
    }
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setNewTask(task.title);
    setNewTaskPriority(task.priority);
    setTaskDialogOpen(true);
  };

  const updateTask = () => {
    if (editingTask && newTask.trim()) {
      const updatedTasks = tasks.map((task) =>
        task.id === editingTask.id
          ? { ...task, title: newTask.trim(), priority: newTaskPriority }
          : task
      );
      saveTasks(updatedTasks);      setEditingTask(null);
      setNewTask('');
      setTaskDialogOpen(false);
    }
  };

  const statsData = [
    {
      title: "Total Categories",
      value: stats.categories,
      icon: <Category sx={{ fontSize: 32 }} />,
      color: "#3b82f6",
      change: loading ? undefined : "+2 this month",
    },
    {
      title: "Menu Items",
      value: stats.items,
      icon: <Restaurant sx={{ fontSize: 32 }} />,
      color: "#10b981",
      change: loading ? undefined : "+12 this week",
    },
    {
      title: "Add-ons",
      value: stats.addons,
      icon: <Add sx={{ fontSize: 32 }} />,
      color: "#f59e0b",
      change: loading ? undefined : "+5 this month",
    },
    {
      title: "Events",
      value: stats.events,
      icon: <Event sx={{ fontSize: 32 }} />,
      color: "#8b5cf6",
      change: loading ? undefined : "2 upcoming",
    },
    {
      title: "Admins",
      value: stats.admins,
      icon: <People sx={{ fontSize: 32 }} />,
      color: "#ef4444",
      change: loading ? undefined : "All active",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Welcome to Pearson Pub Dashboard
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 400 }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={2.4} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                change={stat.change}
                loading={loading}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: "fit-content",
                background: theme.palette.background.paper,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CalendarToday color="primary" />
                Calendar
              </Typography>              <Box
                sx={{
                  '& .MuiDateCalendar-root': {
                    width: '100%',
                    backgroundColor: 'transparent',
                  },
                  '& .MuiPickersCalendarHeader-root': {
                    paddingLeft: 1,
                    paddingRight: 1,
                    marginTop: 0,
                  },
                  '& .MuiDayCalendar-weekDayLabel': {
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                  },
                  '& .MuiPickersDay-root': {
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light + '22',
                    },
                  },
                  '& .MuiPickersDay-today': {
                    backgroundColor: theme.palette.primary.main + ' !important',
                    color: 'white',
                  },
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateCalendar
                    value={calendarDate}
                    onChange={(newValue) => setCalendarDate(newValue)}
                    slots={{
                      day: CustomDay,
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Tasks */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: 400,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Assignment color="primary" />
                  Tasks & Reminders
                </Typography>                <IconButton
                  size="small"
                  onClick={() => setTaskDialogOpen(true)}
                >
                  <Add />
                </IconButton>
              </Box>

              <List sx={{ flex: 1, overflow: "auto" }}>
                {tasks.map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: task.completed
                        ? theme.palette.action.hover
                        : "transparent",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          edge="end"
                          onClick={() => editTask(task)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => deleteTask(task.id)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <IconButton
                        onClick={() => toggleTask(task.id)}
                        size="small"
                        sx={{
                          color: task.completed ? "#10b981" : "default",
                        }}
                      >
                        <Check />
                      </IconButton>
                    </ListItemIcon>                    <ListItemText
                      primary={task.title}
                      secondary={task.priority}
                      sx={{
                        textDecoration: task.completed
                          ? "line-through"
                          : "none",
                        opacity: task.completed ? 0.7 : 1,
                        "& .MuiListItemText-secondary": {
                          color: getPriorityColor(task.priority),
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                        },
                      }}
                    />
                  </ListItem>
                ))}              </List>
            </Paper>
          </motion.div>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: 400,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Event color="primary" />
                  Upcoming Events
                </Typography>
              </Box>

              <List sx={{ flex: 1, overflow: "auto" }}>
                {upcomingEvents.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      opacity: 0.6,
                    }}
                  >
                    <Event sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="body2">No upcoming events</Typography>
                  </Box>
                ) : (
                  upcomingEvents.map((event) => (
                    <ListItem
                      key={event.id}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: "transparent",
                        border: `1px solid ${theme.palette.divider}`,
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Event color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.name}
                        secondary={new Date(event.start_date).toLocaleDateString()}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setEditingTask(null);
          setNewTask('');
          setNewTaskPriority('medium');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Task title"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTaskPriority}
              label="Priority"
              onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTaskDialogOpen(false);
            setEditingTask(null);
            setNewTask('');
            setNewTaskPriority('medium');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingTask ? updateTask : addTask} 
            variant="contained"
            disabled={!newTask.trim()}
          >
            {editingTask ? 'Update' : 'Add'} Task
          </Button>        </DialogActions>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Event />
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              Event Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selectedDateEvents.map((event, index) => (
              <Paper 
                key={event.id} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      {event.name}
                    </Typography>
                    <Chip 
                      label="Active" 
                      color="success" 
                      size="small" 
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Start Date
                      </Typography>
                      <Chip 
                        label={new Date(event.start_date).toLocaleDateString()} 
                        color="info" 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        End Date
                      </Typography>
                      <Chip 
                        label={new Date(event.end_date).toLocaleDateString()} 
                        color="warning" 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>

                  {event.description && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`
                      }}>
                        {event.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
                {index < selectedDateEvents.length - 1 && (
                  <Divider sx={{ mt: 3 }} />
                )}
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEventDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
