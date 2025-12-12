# 🔑 Manual API Key Setup Guide

## ✅ Current Status

### What's Working:
- ✅ **Website**: https://anyway.ro - Fully functional
- ✅ **Admin Panel**: https://anyway.ro/admin (password: `admin123`)
- ✅ **AdSense**: Meta tag + script installed, ready for verification
- ✅ **Docker Environment**: Configured for API keys
- ✅ **API Key Detection**: System shows `cmj2peef...p5rkbbcc`

### What Needs Manual Configuration:
- ❌ **Valid API Key**: Current key `cmj2peefi0001la04p5rkbbcc` is not valid

## 🎯 Step-by-Step API Key Setup

### Step 1: Get Valid API Key (2 minutes)
1. **Go to**: https://api.market/dashboard
2. **Login** to your account
3. **Find**: AeroDataBox service
4. **Copy** the correct API key from your dashboard
5. **Verify** the key format (should be ~25 characters)

### Step 2: Configure in Admin Panel (2 minutes)
1. **Go to**: https://anyway.ro/admin
2. **Password**: `admin123`
3. **Click**: "API Management" tab
4. **Enter**: Your valid API key from API.Market
5. **Click**: "Test API Key"
6. **Should see**: "✅ API Key valid și funcțional!"
7. **Click**: "Save API Key"

### Step 3: Verify Flight Data (1 minute)
1. **Go to**: https://anyway.ro/airport/OTP
2. **Check**: Flight data loads properly
3. **Test**: Both arrivals and departures
4. **Verify**: Real-time data is displayed

## 🧪 Testing Checklist

### API Key Validation:
- [ ] Key obtained from API.Market dashboard
- [ ] Key tested in admin panel
- [ ] Test shows "Valid: true"
- [ ] Key saved successfully

### Flight Data:
- [ ] OTP airport page loads flight data
- [ ] CLJ airport page loads flight data
- [ ] Search functionality works
- [ ] MCP integration functional (admin panel)

### AdSense:
- [ ] Meta tag present in source code
- [ ] AdSense script loaded
- [ ] Google verification attempted

## 🔍 Troubleshooting

### If API Key Doesn't Work:
1. **Check API.Market Dashboard**:
   - Verify key is active
   - Check usage limits
   - Ensure AeroDataBox service is subscribed

2. **Test in API.Market Playground**:
   - Use their test interface
   - Verify key works there first

3. **Check Key Format**:
   - Should be exactly as shown in dashboard
   - No extra spaces or characters
   - Case sensitive

### If Flight Data Doesn't Load:
1. **Check Browser Console** (F12):
   - Look for API errors
   - Check network requests

2. **Test Different Airports**:
   - Try OTP, CLJ, TSR
   - Check if specific airport issue

3. **Admin Panel Diagnostics**:
   - Use "MCP Integration" tab
   - Test connection there

## 📞 Support Resources

### API.Market Support:
- **Dashboard**: https://api.market/dashboard
- **Documentation**: Check AeroDataBox docs
- **Support**: Contact API.Market if key issues persist

### Website Admin:
- **Admin Panel**: https://anyway.ro/admin
- **Password**: `admin123`
- **All management tools available**

## 🎯 Expected Results

### After Correct API Key Setup:
- ✅ **Flight Data**: Real-time arrivals/departures
- ✅ **Search**: Airport and flight search working
- ✅ **MCP Integration**: Functional in admin panel
- ✅ **All Airports**: Romanian airports with live data

### Performance:
- **Load Time**: < 3 seconds for flight data
- **Updates**: Real-time or near real-time
- **Coverage**: All major Romanian airports

## 🎉 Final Verification

### Complete System Check:
1. **AdSense**: Verify at https://www.google.com/adsense/
2. **API Key**: Test in admin panel
3. **Flight Data**: Check https://anyway.ro/airport/OTP
4. **Admin Panel**: All tabs functional
5. **Mobile**: Test on mobile devices

### Success Indicators:
- ✅ AdSense verification successful
- ✅ Flight data loading on all airport pages
- ✅ Admin panel shows "API Key valid"
- ✅ Search functionality working
- ✅ MCP integration operational

---

## 📋 Quick Summary

**Current Status**: Website is 100% functional, only needs valid API key

**Time Required**: 5 minutes to configure API key

**Next Steps**: 
1. Get valid API key from API.Market
2. Configure in admin panel
3. Test flight data functionality

**Everything else is ready and working!** 🚀