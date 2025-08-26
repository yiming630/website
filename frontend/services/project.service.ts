import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import { CreateProjectInput, Project } from '@/types/graphql';

// GraphQL查询和变更定义
const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      color
      owner {
        id
        name
        email
      }
      defaultSettings {
        defaultSourceLanguage
        defaultTargetLanguage
        defaultTranslationStyle
        defaultSpecialization
        requireReview
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($id: ID!, $input: CreateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
      color
      owner {
        id
        name
        email
      }
      defaultSettings {
        defaultSourceLanguage
        defaultTargetLanguage
        defaultTranslationStyle
        defaultSpecialization
        requireReview
      }
      updatedAt
    }
  }
`;

const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

const GET_PROJECT_QUERY = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      color
      owner {
        id
        name
        email
      }
      defaultSettings {
        defaultSourceLanguage
        defaultTargetLanguage
        defaultTranslationStyle
        defaultSpecialization
        requireReview
      }
      documents {
        id
        title
        status
        progress
        targetLanguage
        createdAt
      }
      collaborators {
        id
        name
        email
        role
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_PROJECTS_QUERY = gql`
  query GetProjects($limit: Int, $offset: Int) {
    projects(limit: $limit, offset: $offset) {
      id
      name
      description
      color
      owner {
        id
        name
      }
      defaultSettings {
        defaultTargetLanguage
        defaultTranslationStyle
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * 项目服务类
 * 处理项目创建、管理、协作等功能
 */
export class ProjectService {
  private static instance: ProjectService;
  
  private constructor() {}
  
  /**
   * 获取ProjectService单例实例
   */
  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }
  
  /**
   * 创建新项目
   * @param input 项目创建信息
   * @returns 创建的项目
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PROJECT_MUTATION,
        variables: { input },
      });
      
      return data.createProject;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }
  
  /**
   * 更新项目
   * @param id 项目ID
   * @param input 项目更新信息
   * @returns 更新后的项目
   */
  async updateProject(id: string, input: CreateProjectInput): Promise<Project> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROJECT_MUTATION,
        variables: { id, input },
      });
      
      return data.updateProject;
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }
  
  /**
   * 删除项目
   * @param id 项目ID
   * @returns 是否删除成功
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DELETE_PROJECT_MUTATION,
        variables: { id },
      });
      
      return data.deleteProject;
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }
  
  /**
   * 获取单个项目详情
   * @param id 项目ID
   * @returns 项目详情
   */
  async getProject(id: string): Promise<Project> {
    try {
      const { data } = await apolloClient.query({
        query: GET_PROJECT_QUERY,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      
      return data.project;
    } catch (error) {
      console.error('Get project error:', error);
      throw error;
    }
  }
  
  /**
   * 获取项目列表
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 项目列表
   */
  async getProjects(limit = 10, offset = 0): Promise<Project[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_PROJECTS_QUERY,
        variables: { limit, offset },
      });
      
      return data.projects;
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  }
  
  /**
   * 邀请协作者到项目
   * @param projectId 项目ID
   * @param userEmail 用户邮箱
   * @param role 协作者角色
   * @returns 是否邀请成功
   */
  async inviteCollaborator(
    projectId: string,
    userEmail: string,
    role: string
  ): Promise<boolean> {
    // TODO: 实现邀请协作者的GraphQL mutation
    console.log('Invite collaborator:', { projectId, userEmail, role });
    return true;
  }
  
  /**
   * 移除项目协作者
   * @param projectId 项目ID
   * @param userId 用户ID
   * @returns 是否移除成功
   */
  async removeCollaborator(projectId: string, userId: string): Promise<boolean> {
    // TODO: 实现移除协作者的GraphQL mutation
    console.log('Remove collaborator:', { projectId, userId });
    return true;
  }
}

// 导出单例实例
export const projectService = ProjectService.getInstance();
