graph TD
    %% 系统启动和初始化流程
    START[系统启动] --> A1[🔍 步骤1: 系统连接测试]
    A1 --> A1a[测试Firestore连接]
    A1 --> A1b[测试Pub/Sub连接]
    A1 --> A1c[测试GCS连接]
    A1 --> A1d[测试Gemini API连接]
    A1a --> A2{连接测试通过?}
    A1b --> A2
    A1c --> A2
    A1d --> A2
    
    A2 -->|否| ERROR[❌ 系统连接失败]
    A2 -->|是| B1[⚙️ 步骤2: 初始化服务]
    
    B1 --> B1a[初始化Firestore]
    B1 --> B1b[初始化Pub/Sub队列]
    B1 --> B1c[初始化GCS存储]
    B1a --> C1[📊 步骤3: 分析待处理书籍]
    B1b --> C1
    B1c --> C1
    
    C1 --> C1a[查询pending状态书籍]
    C1a --> C2{有待处理书籍?}
    C2 -->|否| IDLE[ℹ️ 系统空闲待命]
    C2 -->|是| D1[📝 步骤4: 创建翻译任务]
    
    D1 --> D1a[获取书籍章节]
    D1a --> D1b[为每个章节创建Pub/Sub任务]
    D1b --> D1c[更新书籍状态为in_progress]
    D1c --> E1[🚀 步骤5: 启动工作进程]
    
    E1 --> E1a[启动Chapter Workers]
    E1 --> E1b[启动Combination Workers]
    E1a --> F1[📈 步骤6: 启动系统监控]
    E1b --> F1
    
    F1 --> F1a[进程监控任务]
    F1 --> F1b[健康检查任务]
    F1a --> RUNNING[🎯 系统运行中]
    F1b --> RUNNING
    
    %% 原有的异步翻译流程
    RUNNING --> A[客户端提交翻译任务]
    A --> B[Translation Orchestrator]
    B --> C[任务预处理]
    C --> D[章节分割]
    D --> E[存储到Firestore]
    D --> F[上传原文到GCS]
    E --> G[创建Pub/Sub任务]
    G --> H[Chapter Workers]
    H --> I[Gemini API翻译]
    I --> J[流式写入GCS]
    J --> K[更新Firestore状态]
    K --> L[进度监控]
    L --> M{达到30%?}
    M -->|是| N[触发Combination Worker]
    N --> O[早期处理]
    O --> O1[生成目录]
    O --> O2[创建预览]
    O --> O3[更新预览状态]
    L --> P{100%完成?}
    P -->|是| Q[最终合并]
    Q --> R[生成完整翻译]
    R --> S[返回结果]
    
    %% 系统监控和管理流程
    RUNNING --> MON1[🔍 监控进程状态]
    MON1 --> MON2[检查系统资源]
    MON2 --> MON3[队列状态监控]
    MON3 --> MON4{检测到异常?}
    MON4 -->|是| MON5[自动重启进程]
    MON4 -->|否| MON6[记录健康状态]
    MON5 --> MON1
    MON6 --> MON1
    
    %% 系统管理命令
    CMD[管理命令] --> CMD1[status - 显示状态]
    CMD --> CMD2[stop - 紧急停止]
    CMD --> CMD3[test - 测试连接]
    CMD1 --> STATUS[📊 显示系统状态]
    CMD2 --> STOP[⏹️ 优雅关闭系统]
    CMD3 --> TEST[🔬 API连接测试]
    
    %% 错误处理和重启
    ERROR --> STOP
    MON5 --> RESTART{重启次数超限?}
    RESTART -->|是| ALERT[🚨 发送告警]
    RESTART -->|否| MON1
    
    %% 样式定义
    classDef startNode fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef processNode fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef workerNode fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef monitorNode fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef errorNode fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef commandNode fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    
    class START,RUNNING startNode
    class A1,B1,C1,D1,E1,F1,B,C,D,E,F,G processNode
    class H,I,J,N,O,Q,R workerNode
    class MON1,MON2,MON3,MON4,MON5,MON6,L,M,P monitorNode
    class ERROR,STOP,ALERT errorNode
    class CMD,CMD1,CMD2,CMD3,STATUS,TEST commandNode