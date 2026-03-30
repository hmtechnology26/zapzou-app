
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.x'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.x'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error(`Unauthorized: ${authError?.message || 'No user found'}`)

    const body = await req.json()
    const { path, contentType = 'image/webp' } = body
    
    console.log('R2 Upload Request Path:', path)

    if (!path || typeof path !== 'string') throw new Error('Invalid path')

    // Valid path formats for zapzou app
    const servicePathRegex = /^services\/[a-zA-Z0-9_.-]+\.webp$/i;
    const menuItemPathRegex = /^menu-items\/[a-zA-Z0-9_.-]+\.webp$/i;
    const avatarPathRegex = /^avatars\/[a-zA-Z0-9_.-]+$/i;
    const tenantPathRegex = /^tenants\/[a-zA-Z0-9_-]+\/.+$/i;

    const isValid = servicePathRegex.test(path) || menuItemPathRegex.test(path) || avatarPathRegex.test(path) || tenantPathRegex.test(path)

    if (!isValid) {
      throw new Error(`Invalid path format: ${path}`)
    }

    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const accountId = Deno.env.get('R2_ACCOUNT_ID')
    const bucketName = Deno.env.get('R2_BUCKET_NAME')

    if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
      throw new Error('Missing R2 configuration in environment')
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

    return new Response(JSON.stringify({ uploadUrl, expiresIn: 300 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in r2-signed-upload:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
