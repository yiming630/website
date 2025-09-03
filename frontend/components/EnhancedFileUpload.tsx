'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileService } from '@/services/file.service';
import { FileUploadInput, FileUploadResult, FileMetadata, UPLOAD_STATUS_CONFIG, PROCESSING_STATUS_CONFIG } from '@/types/file-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Download,
  Share2,
  Eye,
  Calendar,
  HardDrive,
  Globe,
  Lock,
  FileIcon,
  User,
  Folder,
  Hash,
  Database,
  Shield,
  Clock
} from 'lucide-react';

interface EnhancedFileUploadProps {
  onUploadComplete?: (file: FileMetadata) => void;
  onUploadError?: (error: string) => void;
  projectId?: string;
  maxFileSize?: number; // in MB
}

export function EnhancedFileUpload({ 
  onUploadComplete, 
  onUploadError, 
  projectId,
  maxFileSize = 500 
}: EnhancedFileUploadProps) {
  // Upload state
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Form state
  const [uploadInput, setUploadInput] = useState<FileUploadInput>({
    projectId: projectId || '',
    sourceLanguage: '',
    targetLanguage: 'zh',
    translationStyle: 'GENERAL',
    specialization: 'general',
    visibility: 'private'
  });

  // Supported file formats
  const supportedFormats = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'text/plain': ['.txt'],
    'text/rtf': ['.rtf'],
    'text/html': ['.html', '.htm'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'video/mp4': ['.mp4'],
    'video/x-msvideo': ['.avi'],
    'video/quicktime': ['.mov']
  };

  const acceptedFiles = Object.values(supportedFormats).flat().join(',');

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!FileService.isFileTypeSupported(file.type)) {
      const error = `不支持的文件格式。支持的格式：${Object.values(supportedFormats).flat().join(', ')}`;
      setUploadError(error);
      onUploadError?.(error);
      return;
    }

    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = `文件大小不能超过${maxFileSize}MB`;
      setUploadError(error);
      onUploadError?.(error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadedFile(null);
    setIsDuplicate(false);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const result: FileUploadResult = await FileService.uploadFile(file, uploadInput);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedFile(result.fileMetadata);
      setIsDuplicate(result.isDuplicate);
      
      onUploadComplete?.(result.fileMetadata);
      
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error: any) {
      clearInterval(progressInterval);
      const errorMessage = error.message || '上传失败';
      setUploadError(errorMessage);
      onUploadError?.(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
  }, [uploadInput]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.keys(supportedFormats).reduce((acc, key) => {
      acc[key] = supportedFormats[key as keyof typeof supportedFormats];
      return acc;
    }, {} as Record<string, string[]>),
    multiple: false,
    maxSize: maxFileSize * 1024 * 1024
  });

  const getStatusBadge = (status: string, type: 'upload' | 'processing') => {
    const config = type === 'upload' 
      ? UPLOAD_STATUS_CONFIG[status as keyof typeof UPLOAD_STATUS_CONFIG]
      : PROCESSING_STATUS_CONFIG[status as keyof typeof PROCESSING_STATUS_CONFIG];
    
    if (!config) return null;

    return (
      <Badge variant="secondary" className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const handleDownload = async () => {
    if (uploadedFile) {
      try {
        await FileService.downloadFile(uploadedFile.id, uploadedFile.originalFilename);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            文件上传配置
          </CardTitle>
          <CardDescription>
            配置文件上传选项，设置翻译参数和访问权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>源语言</Label>
              <Select 
                value={uploadInput.sourceLanguage} 
                onValueChange={(value) => setUploadInput(prev => ({ ...prev, sourceLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="自动检测" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">自动检测</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">英语</SelectItem>
                  <SelectItem value="ja">日语</SelectItem>
                  <SelectItem value="ko">韩语</SelectItem>
                  <SelectItem value="fr">法语</SelectItem>
                  <SelectItem value="de">德语</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>目标语言</Label>
              <Select 
                value={uploadInput.targetLanguage} 
                onValueChange={(value) => setUploadInput(prev => ({ ...prev, targetLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">英语</SelectItem>
                  <SelectItem value="ja">日语</SelectItem>
                  <SelectItem value="ko">韩语</SelectItem>
                  <SelectItem value="fr">法语</SelectItem>
                  <SelectItem value="de">德语</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>翻译风格</Label>
              <Select 
                value={uploadInput.translationStyle} 
                onValueChange={(value) => setUploadInput(prev => ({ ...prev, translationStyle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">通用</SelectItem>
                  <SelectItem value="ACADEMIC">学术</SelectItem>
                  <SelectItem value="BUSINESS">商务</SelectItem>
                  <SelectItem value="LEGAL">法律</SelectItem>
                  <SelectItem value="TECHNICAL">技术</SelectItem>
                  <SelectItem value="MEDICAL">医学</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>访问权限</Label>
              <Select 
                value={uploadInput.visibility} 
                onValueChange={(value) => setUploadInput(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">私有</SelectItem>
                  <SelectItem value="public-read">公开只读</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                {isUploading ? (
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              {isUploading ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium">正在上传文件...</p>
                  <div className="max-w-xs mx-auto">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-gray-500 mt-1">{uploadProgress}% 完成</p>
                  </div>
                </div>
              ) : (
                <div>
                  {isDragActive ? (
                    <p className="text-lg text-blue-600">拖放文件到这里上传</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg text-gray-600">拖放文件到这里上传，或点击选择文件</p>
                      <p className="text-sm text-gray-500">
                        支持 PDF, DOCX, DOC, TXT, RTF, HTML, MP3, WAV, MP4, AVI, MOV 格式
                      </p>
                      <p className="text-sm text-gray-500">最大文件大小：{maxFileSize}MB</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Error */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Success & File Metadata Display */}
      {uploadedFile && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-900">
                    {isDuplicate ? '文件已存在' : '上传成功'}
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    {isDuplicate ? '检测到重复文件，返回已有文件信息' : '文件已成功上传到云存储'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  预览
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">文件信息</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件名:</span>
                    <span className="font-medium">{uploadedFile.originalFilename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">类型:</span>
                    <span className="font-medium">{uploadedFile.fileType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">大小:</span>
                    <span className="font-medium">{FileService.formatFileSize(uploadedFile.fileSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">上传状态:</span>
                    {getStatusBadge(uploadedFile.uploadStatus, 'upload')}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">处理状态:</span>
                    {getStatusBadge(uploadedFile.processingStatus, 'processing')}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">存储信息</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">存储桶:</span>
                    <span className="font-medium">{uploadedFile.bucketName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">区域:</span>
                    <span className="font-medium">{uploadedFile.storageRegion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">存储类型:</span>
                    <span className="font-medium">{uploadedFile.storageClass}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">访问权限:</span>
                    <div className="flex items-center gap-1">
                      {uploadedFile.visibility === 'private' ? (
                        <Lock className="h-3 w-3 text-red-500" />
                      ) : (
                        <Globe className="h-3 w-3 text-green-500" />
                      )}
                      <span className="text-xs">
                        {uploadedFile.visibility === 'private' ? '私有' : '公开'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">加密:</span>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-gray-500" />
                      <span className="text-xs">{uploadedFile.isEncrypted ? '已加密' : '未加密'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">翻译配置</span>
                </div>
                <div className="space-y-2 text-sm">
                  {uploadedFile.sourceLanguage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">源语言:</span>
                      <span className="font-medium">{uploadedFile.sourceLanguage}</span>
                    </div>
                  )}
                  {uploadedFile.targetLanguage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">目标语言:</span>
                      <span className="font-medium">{uploadedFile.targetLanguage}</span>
                    </div>
                  )}
                  {uploadedFile.translationStyle && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">翻译风格:</span>
                      <span className="font-medium">{uploadedFile.translationStyle}</span>
                    </div>
                  )}
                  {uploadedFile.specialization && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">专业领域:</span>
                      <span className="font-medium">{uploadedFile.specialization}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Technical Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-medium">技术信息</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {uploadedFile.id}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件哈希:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {uploadedFile.fileHash.substring(0, 16)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">存储密钥:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {uploadedFile.fileKey}
                    </code>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">创建时间:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs">
                        {new Date(uploadedFile.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {uploadedFile.uploadedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">上传完成:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">
                          {new Date(uploadedFile.uploadedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  {uploadedFile.user && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">上传用户:</span>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{uploadedFile.user.name}</span>
                      </div>
                    </div>
                  )}
                  {uploadedFile.project && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">所属项目:</span>
                      <div className="flex items-center gap-1">
                        <Folder className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{uploadedFile.project.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Show duplicate message */}
            {isDuplicate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  系统检测到相同的文件已经存在，为避免重复存储，返回了已有文件的信息。
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedFileUpload;