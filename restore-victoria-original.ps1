# Restore Victoria Ocara Original Content
# Since the original content was overwritten, we need to restore it

# First, let's create a backup of current content
ssh root@23.88.113.154 "cp /var/www/victoriaocara.com/index.html /var/www/victoriaocara.com/index.html.gallery-backup"

# Create a simple maintenance page while we determine the original content
$maintenanceContent = @"
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Victoria Ocara - Website în mentenanță</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 50px 20px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 600px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .contact {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Victoria Ocara</h1>
        <p>Website în mentenanță</p>
        <p>Ne cerem scuze pentru inconvenient. Site-ul este în proces de restaurare la conținutul original.</p>
        
        <div class="contact">
            <h3>Contact</h3>
            <p>Pentru informații, vă rugăm să ne contactați.</p>
        </div>
    </div>
</body>
</html>
"@

# Upload the maintenance page
$maintenanceContent | ssh root@23.88.113.154 "cat > /var/www/victoriaocara.com/index.html"

Write-Host "✅ Maintenance page uploaded to victoriaocara.com"
Write-Host "🔍 Original content needs to be identified and restored"