import { Router } from 'express'
import { AuthService } from '../services/authService'
import { createUserSchema, loginSchema } from '../../shared/validation'
import { requireAuth } from '../middleware/auth'

export const authRouter = Router()

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    const result = await AuthService.login(validatedData)
    
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    })
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body)
    const { confirmPassword, ...userData } = validatedData
    
    const result = await AuthService.register(userData)
    
    res.status(201).json({
      message: 'Registration successful',
      user: result.user,
      token: result.token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await AuthService.getUserById(req.user!.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // Here we could add token blacklisting if needed
  res.json({ message: 'Logout successful' })
})