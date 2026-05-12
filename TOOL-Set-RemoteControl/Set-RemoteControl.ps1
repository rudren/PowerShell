function Set-RemoteControl {
    <#
    .SYNOPSIS
        Set the Remote Control (shadowing) policy for Terminal Services on a local or remote machine.

    .DESCRIPTION
        Set the Remote Control (shadowing) policy for Terminal Services on a local or remote machine
        using the Win32_TSRemoteControl WMI class.

        Available policy values:
          Disabled                  - Remote control is disabled
          FullControlWithConsent    - Full control; user must give permission
          FullControlWithoutConsent - Full control; no user permission required
          ViewSessionWithConsent    - View only; user must give permission
          ViewSessionWithoutConsent - View only; no user permission required

    .PARAMETER ComputerName
        Specifies one or more computers to configure. Defaults to the local computer.

    .PARAMETER Policy
        Specifies the remote control policy to apply.

    .PARAMETER Credential
        Specifies the credential to use when connecting to remote computers.

    .EXAMPLE
        PS C:\> Set-RemoteControl -Policy FullControlWithConsent

        Enables full remote control with user consent on the local machine.

    .EXAMPLE
        PS C:\> Set-RemoteControl -ComputerName SERVER01 -Policy Disabled

        Disables remote control on SERVER01.

    .EXAMPLE
        PS C:\> Set-RemoteControl -ComputerName SERVER01, SERVER02 -Policy ViewSessionWithConsent

        Sets view-only remote control (with consent) on SERVER01 and SERVER02.

    .EXAMPLE
        PS C:\> Set-RemoteControl -ComputerName SERVER01 -Policy FullControlWithConsent -WhatIf

        Shows what would happen without making any changes.

    .NOTES
        Francois-Xavier Cat
        @lazywinadmin
        lazywinadmin.com
        github.com/lazywinadmin
    .LINK
        https://github.com/lazywinadmin/PowerShell
#>
    #Requires -Version 3.0
    #Requires -RunAsAdministrator
    [CmdletBinding(SupportsShouldProcess = $true)]
    param (
        [Parameter(
            ValueFromPipeline = $true,
            ValueFromPipelineByPropertyName = $true)]
        [Alias('CN', '__SERVER', 'PSComputerName')]
        [String[]]$ComputerName = $env:COMPUTERNAME,

        [Parameter(Mandatory = $true)]
        [ValidateSet(
            'Disabled',
            'FullControlWithConsent',
            'FullControlWithoutConsent',
            'ViewSessionWithConsent',
            'ViewSessionWithoutConsent'
        )]
        [String]$Policy,

        [Alias('RunAs')]
        [pscredential]
        [System.Management.Automation.Credential()]
        $Credential = [System.Management.Automation.PSCredential]::Empty
    )

    BEGIN {
        $PolicyValue = @{
            'Disabled'                    = 0
            'FullControlWithConsent'      = 1
            'FullControlWithoutConsent'   = 2
            'ViewSessionWithConsent'      = 3
            'ViewSessionWithoutConsent'   = 4
        }
    }

    PROCESS {
        FOREACH ($Computer in $ComputerName) {
            $Computer = $Computer.ToUpper()
            $CimSessionLocal = $null
            TRY {
                IF ($PSCmdlet.ShouldProcess($Computer, "Set Remote Control Policy to '$Policy'")) {

                    Write-Verbose -Message "PROCESS - $Computer - Testing connection"
                    IF (Test-Connection -ComputerName $Computer -Count 1 -Quiet) {

                        $CIMSessionParams = @{
                            ComputerName  = $Computer
                            ErrorAction   = 'Stop'
                            ErrorVariable = 'ErrorCimSession'
                        }
                        IF ($PSBoundParameters['Credential']) {
                            $CIMSessionParams.Credential = $Credential
                        }

                        IF ((Test-WSMan -ComputerName $Computer -ErrorAction SilentlyContinue).productversion -match 'Stack: 3.0') {
                            Write-Verbose -Message "PROCESS - $Computer - WSMan is responsive"
                            $CimSessionLocal = New-CimSession @CIMSessionParams
                        }
                        ELSE {
                            Write-Verbose -Message "PROCESS - $Computer - Falling back to DCOM protocol"
                            $CIMSessionParams.SessionOption = New-CimSessionOption -Protocol Dcom
                            $CimSessionLocal = New-CimSession @CIMSessionParams
                        }

                        Write-Verbose -Message "PROCESS - $Computer - Querying Win32_TSRemoteControl"
                        $RCInstances = Get-CimInstance -CimSession $CimSessionLocal `
                            -ClassName 'Win32_TSRemoteControl' `
                            -Namespace 'root\cimv2\terminalservices' `
                            -ErrorAction Stop

                        FOREACH ($RC in $RCInstances) {
                            Write-Verbose -Message "PROCESS - $Computer - Setting RemoteControlPolicy to '$Policy' ($($PolicyValue[$Policy]))"
                            $RC | Invoke-CimMethod -MethodName 'SetRemoteControl' -Arguments @{
                                PolicySourceRemoteControl = [uint32]0
                                RemoteControlPolicy       = [uint32]$PolicyValue[$Policy]
                            } -ErrorAction Stop | Out-Null
                        }
                    }
                    ELSE {
                        Write-Warning -Message "PROCESS - $Computer - Unreachable"
                    }
                }
            }
            CATCH {
                Write-Warning -Message "PROCESS - $Computer - Something went wrong"
                Write-Warning -Message $Error[0].Exception.Message
            }
            FINALLY {
                IF ($CimSessionLocal) {
                    Write-Verbose -Message "PROCESS - $Computer - Closing CIM session"
                    Remove-CimSession -CimSession $CimSessionLocal
                }
            }
        }
    }

    END {
        Write-Verbose -Message "END - Script completed"
    }
}
