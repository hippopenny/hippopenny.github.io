---
layout: default
title: Redirect
permalink: /redirect/
---

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title }}</title>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;

            // Redirect to App Store if iOS
            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                window.location.href = "https://apps.apple.com/us/app/wacky-warper/id6502666713";
                return;
            }

            // Redirect to Play Store if Android
            if (/android/i.test(userAgent)) {
                window.location.href = "https://play.google.com/store/apps/details?id=com.hippopenny.offrail";
                return;
            }

            // Redirect to website if PC
            window.location.href = "https://www.hippopenny.com";
        });
    </script>
</head>
<body>
    <p>Redirecting...</p>
    <p>If you are not redirected automatically, <a href="https://www.hippopenny.com">click here</a>.</p>
</body>
</html>
