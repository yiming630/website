'use client';

import React, { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { TranslationStyle } from '@/types/graphql';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * 文档上传组件
 * 展示如何使用文档服务和hooks上传和管理文档
 */
export function DocumentUpload() {
  const { documents, uploadDocument, deleteDocument, loading, error } = useDocuments();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [translationStyle, setTranslationStyle] = useState<TranslationStyle>(TranslationStyle.GENERAL);
  const [specialization, setSpecialization] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 支持的文件格式
  const supportedFormats = ['pdf', 'docx', 'txt', 'epub', 'mobi', 'azw'];
  
  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 验证文件格式
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      setUploadError(`不支持的文件格式。支持的格式：${supportedFormats.join(', ')}`);
      return;
    }
    
    // 验证文件大小（最大50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError('文件大小不能超过50MB');
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null);
  };
  
  // 处理文件上传
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const document = await uploadDocument(selectedFile, {
        targetLanguage,
        translationStyle,
        specialization,
      });
      
      console.log('Document uploaded successfully:', document);
      
      // 清除选择的文件
      setSelectedFile(null);
      
      // 重置表单
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setUploadError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };
  
  // 处理文档删除
  const handleDelete = async (documentId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return;
    
    try {
      await deleteDocument(documentId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };
  
  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PROCESSING: { label: '处理中', color: 'bg-blue-500', icon: Loader2 },
      TRANSLATING: { label: '翻译中', color: 'bg-yellow-500', icon: Loader2 },
      REVIEWING: { label: '审核中', color: 'bg-purple-500', icon: Loader2 },
      COMPLETED: { label: '已完成', color: 'bg-green-500', icon: CheckCircle },
      FAILED: { label: '失败', color: 'bg-red-500', icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-500',
      icon: FileText,
    };
    
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* 上传表单 */}
      <Card>
        <CardHeader>
          <CardTitle>上传文档</CardTitle>
          <CardDescription>
            选择要翻译的文档，支持PDF、DOCX、TXT、EPUB等格式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 文件选择 */}
          <div className="space-y-2">
            <label htmlFor="file-input" className="text-sm font-medium">
              选择文件
            </label>
            <div className="flex gap-2">
              <Input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt,.epub,.mobi,.azw"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground self-center">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </div>
          </div>
          
          {/* 翻译设置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 目标语言 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">目标语言</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 翻译风格 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">翻译风格</label>
              <Select value={translationStyle} onValueChange={(v) => setTranslationStyle(v as TranslationStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TranslationStyle.GENERAL}>通用</SelectItem>
                  <SelectItem value={TranslationStyle.ACADEMIC}>学术</SelectItem>
                  <SelectItem value={TranslationStyle.BUSINESS}>商务</SelectItem>
                  <SelectItem value={TranslationStyle.LEGAL}>法律</SelectItem>
                  <SelectItem value={TranslationStyle.TECHNICAL}>技术</SelectItem>
                  <SelectItem value={TranslationStyle.CREATIVE}>创意</SelectItem>
                  <SelectItem value={TranslationStyle.MEDICAL}>医疗</SelectItem>
                  <SelectItem value={TranslationStyle.FINANCIAL}>金融</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 专业领域 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">专业领域</label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">通用</SelectItem>
                  <SelectItem value="technology">科技</SelectItem>
                  <SelectItem value="literature">文学</SelectItem>
                  <SelectItem value="science">科学</SelectItem>
                  <SelectItem value="education">教育</SelectItem>
                  <SelectItem value="business">商业</SelectItem>
                  <SelectItem value="law">法律</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 错误提示 */}
          {(uploadError || error) && (
            <Alert variant="destructive">
              <AlertDescription>{uploadError || error}</AlertDescription>
            </Alert>
          )}
          
          {/* 上传按钮 */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                上传并开始翻译
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* 文档列表 */}
      <Card>
        <CardHeader>
          <CardTitle>我的文档</CardTitle>
          <CardDescription>
            已上传的文档和翻译状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无文档，请上传文档开始翻译
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.sourceLanguage} → {doc.targetLanguage} · {doc.translationStyle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {doc.status !== 'COMPLETED' && doc.status !== 'FAILED' && (
                      <div className="w-32">
                        <Progress value={doc.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {doc.progress}%
                        </span>
                      </div>
                    )}
                    {getStatusBadge(doc.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
