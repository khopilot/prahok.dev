import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { prisma } from '../server';
import logger from '../utils/logger';

const router = Router();

// Get all projects for the authenticated user
router.get(
  '/',
  authenticate,
  query('status').optional().isIn(['ACTIVE', 'ARCHIVED', 'DELETED']),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string || 'ACTIVE';

      const projects = await prisma.project.findMany({
        where: {
          userId,
          status: status as any,
        },
        orderBy: {
          lastAccessedAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          prompt: true,
          previewUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastAccessedAt: true,
          generatedFiles: true,
        },
      });

      res.json({
        success: true,
        projects,
      });
    } catch (error) {
      logger.error('Error fetching projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects',
      });
    }
  }
);

// Get a single project
router.get(
  '/:id',
  authenticate,
  param('id').isString().notEmpty(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      // Update last accessed time
      await prisma.project.update({
        where: { id: projectId },
        data: { lastAccessedAt: new Date() },
      });

      res.json({
        success: true,
        project,
      });
    } catch (error) {
      logger.error('Error fetching project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch project',
      });
    }
  }
);

// Create a new project
router.post(
  '/',
  authenticate,
  body('name').isString().notEmpty().trim(),
  body('description').isString().notEmpty().trim(),
  body('prompt').isString().notEmpty(),
  body('sandboxId').optional().isString(),
  body('previewUrl').optional().isString(),
  body('generatedFiles').optional().isArray(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name, description, prompt, sandboxId, previewUrl, generatedFiles } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          prompt,
          sandboxId,
          previewUrl,
          generatedFiles: generatedFiles || [],
          userId,
        },
      });

      res.status(201).json({
        success: true,
        project,
      });
    } catch (error) {
      logger.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
      });
    }
  }
);

// Update a project
router.put(
  '/:id',
  authenticate,
  param('id').isString().notEmpty(),
  body('name').optional().isString().notEmpty().trim(),
  body('description').optional().isString().notEmpty().trim(),
  body('previewUrl').optional().isString(),
  body('generatedFiles').optional().isArray(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      });

      if (!existingProject) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...req.body,
          lastAccessedAt: new Date(),
        },
      });

      res.json({
        success: true,
        project,
      });
    } catch (error) {
      logger.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project',
      });
    }
  }
);

// Archive a project
router.patch(
  '/:id/archive',
  authenticate,
  param('id').isString().notEmpty(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;

      const project = await prisma.project.updateMany({
        where: {
          id: projectId,
          userId,
        },
        data: {
          status: 'ARCHIVED',
        },
      });

      if (project.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      res.json({
        success: true,
        message: 'Project archived successfully',
      });
    } catch (error) {
      logger.error('Error archiving project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to archive project',
      });
    }
  }
);

// Delete a project (soft delete)
router.delete(
  '/:id',
  authenticate,
  param('id').isString().notEmpty(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;

      const project = await prisma.project.updateMany({
        where: {
          id: projectId,
          userId,
        },
        data: {
          status: 'DELETED',
        },
      });

      if (project.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project',
      });
    }
  }
);

export { router as projectsRouter };