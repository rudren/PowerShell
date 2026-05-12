function Get-RemoteControl {
    <#
    .SYNOPSIS
        Get the Remote Control (shadowing) settings for Terminal Services on a local or remote machine.

    .DESCRIPTION
        Get the Remote Control (shadowing) settings for Terminal Services on a local or remote machine
        using the Win32_TSRemoteControl WMI class.

        RemoteControlPolicy values:
          0 - Disabled
          1 - FullControlWithConsent     (full control, user must confirm)
          2 - FullControlWithoutConsent  (full control, no confirmation required)
          3 - ViewSessionWithConsent     (view only, user must confirm)
          4 - ViewSessionWithoutConsent  (view only, no confirmation required)

    .PARAMETER ComputerName
        Specifies one or more computers to query. Defaults to the local computer.

    .PARAMETER Credential
        Specifies the credential to use when connecting to remote computers.

    .PARAMETER CimSession
        Specifies one or more existing CIM Session(s) to use.

    .EXAMPLE
        PS C:\> Get-RemoteControl

        Returns the Remote Control settings for the local machine.

    .EXAMPLE
        PS C:\> Get-RemoteControl -ComputerName SERVER01

        Returns the Remote Control settings for SERVER01.

    .EXAMPLE
        PS C:\> Get-RemoteControl -ComputerName SERVER01, SERVER02

        Returns the Remote Control settings for SERVER01 and SERVER02.

    .EXAMPLE
        PS C:\> Get-RemoteControl -ComputerName SERVER01 -Credential (Get-Credential)

        Returns the Remote Control settings for SERVER01 using alternate credentials.

    .EXAMPLE
        PS C:\> $Session = New-CimSession -ComputerName SERVER01
        PS C:\> Get-RemoteControl -CimSession $Session

        Returns the Remote Control settings using an existing CIM session.

    .NOTES
        Francois-Xavier Cat
        @lazywinadmin
        lazywinadmin.com
        github.com/lazywinadmin
    .LINK
        https://github.com/lazywinadmin/PowerShell
#>
    #Requires -Version 3.0
    [CmdletBinding(DefaultParameterSetName = 'ComputerName')]
    param (
        [Parameter(
            ParameterSetName = 'ComputerName',
            ValueFromPipeline = $true,
            ValueFromPipelineByPropertyName = $true)]
        [Alias('CN', '__SERVER', 'PSComputerName')]
        [String[]]$ComputerName = $env:COMPUTERNAME,

        [Parameter(ParameterSetName = 'ComputerName')]
        [Alias('RunAs')]
        [pscredential]
        [System.Management.Automation.Credential()]
        $Credential = [System.Management.Automation.PSCredential]::Empty,

        [Parameter(ParameterSetName = 'CimSession')]
        [Microsoft.Management.Infrastructure.CimSession[]]$CimSession
    )

    BEGIN {
        $PolicyMap = @{
            0 = 'Disabled'
            1 = 'FullControlWithConsent'
            2 = 'FullControlWithoutConsent'
            3 = 'ViewSessionWithConsent'
            4 = 'ViewSessionWithoutConsent'
        }
    }

    PROCESS {
        IF ($PSBoundParameters['CimSession']) {
            FOREACH ($Cim in $CimSession) {
                $CIMComputer = $($Cim.ComputerName).ToUpper()
                TRY {
                    Write-Verbose -Message "PROCESS - $CIMComputer - Querying Win32_TSRemoteControl"
                    $RCInstances = Get-CimInstance -CimSession $Cim `
                        -ClassName 'Win32_TSRemoteControl' `
                        -Namespace 'root\cimv2\terminalservices' `
                        -ErrorAction Stop

                    FOREACH ($RC in $RCInstances) {
                        [pscustomobject][ordered]@{
                            ComputerName         = $CIMComputer
                            TerminalName         = $RC.TerminalName
                            RemoteControlPolicy  = $PolicyMap[[int]$RC.RemoteControlPolicy]
                            RemoteControlEnabled = ($RC.RemoteControlPolicy -ne 0)
                        }
                    }
                }
                CATCH {
                    Write-Warning -Message "PROCESS - $CIMComputer - Something went wrong"
                    Write-Warning -Message $Error[0].Exception.Message
                }
            }
        }
        ELSE {
            FOREACH ($Computer in $ComputerName) {
                $Computer = $Computer.ToUpper()
                $CimSessionLocal = $null
                TRY {
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
                            [pscustomobject][ordered]@{
                                ComputerName         = $Computer
                                TerminalName         = $RC.TerminalName
                                RemoteControlPolicy  = $PolicyMap[[int]$RC.RemoteControlPolicy]
                                RemoteControlEnabled = ($RC.RemoteControlPolicy -ne 0)
                            }
                        }
                    }
                    ELSE {
                        Write-Warning -Message "PROCESS - $Computer - Unreachable"
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
    }

    END {
        Write-Verbose -Message "END - Script completed"
    }
}
