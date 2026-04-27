<#
.SYNOPSIS
    Post a cloud-related update to LinkedIn via LinkedIn API.
.DESCRIPTION
    Publishes a text post to a LinkedIn profile using the LinkedIn REST API (UGC Posts endpoint).
    Requires a valid OAuth 2.0 Bearer token with the w_member_social permission scope.

.PARAMETER AccessToken
    LinkedIn OAuth 2.0 Bearer access token with w_member_social scope.

.PARAMETER PersonUrn
    LinkedIn member URN in the format: urn:li:person:<id>
    Retrieve your own URN by calling: https://api.linkedin.com/v2/me

.PARAMETER PostContent
    The text body of the LinkedIn post. Defaults to today's cloud update post.

.EXAMPLE
    $token = "AQV..."
    $urn   = "urn:li:person:abc123"
    .\Post-LinkedInCloudUpdate.ps1 -AccessToken $token -PersonUrn $urn

    Posts today's cloud update to the LinkedIn profile identified by the URN.

.EXAMPLE
    .\Post-LinkedInCloudUpdate.ps1 -AccessToken $token -PersonUrn $urn -PostContent "Custom post text here."

    Posts a custom message instead of the default cloud update.

.NOTES
    VERSION HISTORY
    1.0 | 2026/04/27 | Initial version — daily Azure/Cloud PowerShell tip post

    LinkedIn API reference:
    https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api
#>
[CmdletBinding(SupportsShouldProcess)]
Param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string] $AccessToken,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^urn:li:person:.+$')]
    [string] $PersonUrn,

    [Parameter(Mandatory = $false)]
    [string] $PostContent
)

# ---------------------------------------------------------------------------
# Default post — today's Azure / Cloud PowerShell update (2026-04-27)
# ---------------------------------------------------------------------------
$defaultPost = @"
☁️ Azure & Cloud PowerShell Tips — April 27, 2026

Here are some practical Azure automation scripts that can save you hours every week:

🔐 Retrieve your Azure Bearer Token in one line
Get-AzToken wraps the Az.Accounts SDK so you can call any Azure REST API directly — no manual token juggling needed.

📋 Trigger Azure Policy Compliance Evaluation on demand
Don't wait for the 24-hour evaluation cycle. Invoke-ComplianceEvaluation fires a REST call that re-scans your subscription or resource group immediately — perfect for post-deployment validation in CI/CD pipelines.

🌐 Update App Service IP Restrictions from a CSV
AppService-Update_RestrictionIP.ps1 reads a CSV of allowed CIDRs and idempotently syncs them to your App Service access rules — great for allowlisting corporate egress IPs at scale.

🔖 Publish OpenAPI / Swagger definitions to Azure APIM automatically
AZURE-APIM-Publish_API_Definitions_Swagger.ps1 imports your Swagger spec and registers a liveness endpoint in one shot — ideal as a post-deploy step in your release pipeline.

🛡️ Download Azure IP Ranges & Service Tags weekly
Get-AzureIPRangesAndServiceTags pulls the latest Microsoft-published JSON so your NSG rules and firewalls stay current with Azure's ever-changing IP space.

All scripts are open-source on GitHub. Automate more, click less. 🚀

#Azure #CloudComputing #PowerShell #DevOps #AzurePolicy #APIM #Automation #MicrosoftAzure #CloudSecurity #Infrastructure
"@

if (-not $PSBoundParameters.ContainsKey('PostContent') -or [string]::IsNullOrWhiteSpace($PostContent)) {
    $PostContent = $defaultPost
}

$uri = 'https://api.linkedin.com/v2/ugcPosts'

$body = @{
    author        = $PersonUrn
    lifecycleState = 'PUBLISHED'
    specificContent = @{
        'com.linkedin.ugc.ShareContent' = @{
            shareCommentary = @{
                text = $PostContent
            }
            shareMediaCategory = 'NONE'
        }
    }
    visibility = @{
        'com.linkedin.ugc.MemberNetworkVisibility' = 'PUBLIC'
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    'Authorization'              = "Bearer $AccessToken"
    'Content-Type'               = 'application/json'
    'X-Restli-Protocol-Version'  = '2.0.0'
}

if ($PSCmdlet.ShouldProcess($PersonUrn, 'Post LinkedIn cloud update')) {
    try {
        Write-Verbose "Posting to LinkedIn UGC Posts API..."
        $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ErrorAction Stop
        Write-Output "Post published successfully. Post ID: $($response.id)"
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Error "LinkedIn API call failed (HTTP $statusCode): $($_.Exception.Message)"
        throw
    }
}
