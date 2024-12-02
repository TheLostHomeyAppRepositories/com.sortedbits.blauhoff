## Deye Sun *K SG04LP3 EU Series
Deye Sun *K SG04LP3 EU Series with modbus interface


### Holding Registers
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range |
| ------- | ------ | --------- | ---- |----- | -------------- | ------------- | --------------- | ----- |
| 1| 1| UINT16| | -| No| status_code.modbus_address| Modbus address| - |
| 2| 1| UINT16| | -| No| status_code.modbus_protocol| Modbus version| - |
| 3| 5| STRING| | -| No| serial| Serial number| - |
| 104| 1| UINT16| | 10| No| status_code.zero_export_power| undefined| - |
| 141| 1| UINT16| | -| Yes| status_text.energie_management_model| undefined| - |
| 142| 1| UINT16| | -| Yes| status_text.work_mode| Work mode| - |
| 143| 1| UINT16| | -| No| status_code.max_sell_power| Max selling power| - |
| 145| 1| UINT16| | -| Yes| status_text.sell_solar| Sell solar| - |
| 146| 1| UINT16| | -| Yes| status_text.time_of_use| Grid peak shaving| - |
| 148| 1| UINT16| | -| Yes| status_text.tou_time1| ToU Time 1| - |
| 149| 1| UINT16| | -| Yes| status_text.tou_time2| ToU Time 2| - |
| 150| 1| UINT16| | -| Yes| status_text.tou_time3| ToU Time 3| - |
| 151| 1| UINT16| | -| Yes| status_text.tou_time4| ToU Time 4| - |
| 152| 1| UINT16| | -| Yes| status_text.tou_time5| ToU Time 5| - |
| 153| 1| UINT16| | -| Yes| status_text.tou_time6| ToU Time 6| - |
| 154| 1| UINT16| W| -| No| measure_power.powerlimit1| Power limit 1| - |
| 155| 1| UINT16| W| -| No| measure_power.powerlimit2| Power limit 2| - |
| 156| 1| UINT16| W| -| No| measure_power.powerlimit3| Power limit 3| - |
| 157| 1| UINT16| W| -| No| measure_power.powerlimit4| Power limit 4| - |
| 158| 1| UINT16| W| -| No| measure_power.powerlimit5| Power limit 5| - |
| 159| 1| UINT16| W| -| No| measure_power.powerlimit6| Power limit 6| - |
| 166| 1| UINT16| %| -| No| measure_percentage.tou_battery1| ToU Battery 1| - |
| 167| 1| UINT16| %| -| No| measure_percentage.tou_battery2| ToU Battery 2| - |
| 168| 1| UINT16| %| -| No| measure_percentage.tou_battery3| ToU Battery 3| - |
| 169| 1| UINT16| %| -| No| measure_percentage.tou_battery4| ToU Battery 4| - |
| 170| 1| UINT16| %| -| No| measure_percentage.tou_battery5| ToU Battery 5| - |
| 171| 1| UINT16| %| -| No| measure_percentage.tou_battery6| ToU Battery 6| - |
| 172| 1| UINT16| | -| Yes| status_text.grid_charging1| Grid charging 1| - |
| 172| 1| UINT16| | -| Yes| status_text.generator_charging1| Generator charging 1| - |
| 173| 1| UINT16| | -| Yes| status_text.grid_charging2| Grid charging 2| - |
| 173| 1| UINT16| | -| Yes| status_text.generator_charging2| Generator charging 2| - |
| 174| 1| UINT16| | -| Yes| status_text.grid_charging3| Grid charging 3| - |
| 174| 1| UINT16| | -| Yes| status_text.generator_charging3| Generator charging 3| - |
| 175| 1| UINT16| | -| Yes| status_text.grid_charging4| Grid charging 4| - |
| 175| 1| UINT16| | -| Yes| status_text.generator_charging4| Generator charging 4| - |
| 176| 1| UINT16| | -| Yes| status_text.grid_charging5| Grid charging 5| - |
| 176| 1| UINT16| | -| Yes| status_text.generator_charging5| Generator charging 5| - |
| 177| 1| UINT16| | -| Yes| status_text.grid_charging6| Grid charging 6| - |
| 177| 1| UINT16| | -| Yes| status_text.generator_charging6| Generator charging 6| - |
| 178| 1| UINT16| | -| Yes| status_text.grid_peak_shaving| Grid peak shaving| - |
| 191| 1| UINT16| | -| No| status_code.grid_peak_shaving_power| undefined| - |
| 340| 1| UINT16| | -| No| status_code.max_solar_power| undefined| - |
| 500| 1| UINT16| | -| Yes| status_text.run_mode| Run mode| - |
| 514| 1| UINT16| kWh| 0.1| No| meter_power.daily_battery_charge| Daily battery charge| - |
| 515| 1| UINT16| kWh| 0.1| No| meter_power.daily_battery_discharge| Daily battery discharge| - |
| 516| 1| UINT16| kWh| 0.1| No| meter_power.total_battery_charge| Total battery charge| - |
| 518| 1| UINT16| kWh| 0.1| No| meter_power.total_battery_discharge| Total battery discharge| - |
| 520| 1| UINT16| kWh| 0.1| No| meter_power.daily_from_grid| Daily from grid| - |
| 521| 1| UINT16| kWh| 0.1| No| meter_power.daily_to_grid| Daily to grid| - |
| 522| 1| UINT16| kWh| 0.1| No| meter_power.total_from_grid| Total from grid| - |
| 524| 1| UINT16| kWh| 0.1| No| meter_power.total_to_grid| Total to grid| - |
| 526| 1| UINT16| kWh| 0.1| No| meter_power.daily_to_load| Daily to load| - |
| 527| 1| UINT16| kWh| 0.1| No| meter_power.total_to_load| Total to load| - |
| 529| 1| UINT16| kWh| 0.1| No| meter_power.daily_pv| Daily PV| - |
| 534| 2| UINT16| kWh| 0.1| No| meter_power.total_pv| Total PV| - |
| 540| 1| UINT16| °C| 0.01| No| measure_temperature.dc| DC temperature| - |
| 541| 1| UINT16| °C| 0.01| No| measure_temperature.ac| AC temperature| - |
| 586| 1| UINT16| °C| 0.01| No| measure_temperature.battery1| Battery 1 temperature| - |
| 587| 1| INT16| V| 0.1| No| measure_voltage.battery1| Battery 1 voltage| - |
| 588| 1| UINT16| %| -| No| measure_percentage.battery1| undefined| - |
| 590| 1| INT16| W| -| No| measure_power.battery1| Battery 1 power| - |
| 591| 1| INT16| A| 0.01| No| measure_current.battery1| Battery 1 current| - |
| 598| 1| UINT16| V| 0.1| No| measure_voltage.grid_l1| Grid L1 voltage| - |
| 599| 1| UINT16| V| 0.1| No| measure_voltage.grid_l2| Grid L2 voltage| - |
| 600| 1| UINT16| V| 0.1| No| measure_voltage.grid_l3| Grid L3 voltage| - |
| 625| 1| UINT16| W| -| No| measure_power.grid| Grid output power| - |
| 636| 1| INT16| W| -| No| measure_power.inverter| Inverter power| - |
| 643| 1| UINT16| W| -| No| measure_power.ups| undefined| - |
| 653| 1| INT16| W| -| No| measure_power.load| load power| - |
| 672| 1| UINT16| W| -| No| measure_power.pv1| PV 1 power| - |
| 673| 1| UINT16| W| -| No| measure_power.pv2| PV 2 power| - |

### Supported flow actions

#### Set max solar power
Set max solar power to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |

#### Set solar selling
Set solar selling to [[enabled]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| enabled | Solar selling | checkbox | - |

#### Set max sell power
Set max sell power to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |

#### Write value to register
Write [[value]] to [[registerType]] register [[register]]
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Value | number | - |
| registerType | The register type where to write to | dropdown | - |
| register | Register | autocomplete | - |

#### Set energy pattern
Set energy pattern to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Energy pattern | dropdown | - |

#### Set grid peak shaving on
Set grid peak shaving on with [[value]] power.
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |

#### Set grid peak shaving off
Set grid peak shaving off.

#### Set work mode and zero export power
Set workmode to [[workmode]] and Zero Export Power to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |
| workmode | Workmode | dropdown | - |

#### Turn time of use on/off
Set time of use to [[enabled]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| enabled | Time of use | dropdown | - |

#### Turn time of use on/off for this day
Set time of use to [[enabled]] for [[day]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| enabled | Time of use | dropdown | - |
| day | Day | dropdown | - |

#### Set time of use parameters for timeslot
For timeslot [[timeslot]] set the start time to [[time]]. Set grid charge to [[gridcharge]] and generator charge to [[generatorcharge]]. Power limit is [[powerlimit]] and minimum battery charge is [[batterycharge]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| timeslot | Timeslot | dropdown | - |
| time | Time | time | - |
| gridcharge | Grid charging | dropdown | - |
| generatorcharge | Generator charging | dropdown | - |
| powerlimit | Power limit | range | - |
| batterycharge | Minimum battery charge | range | - |

#### Set time of use parameters for all timeslots
For all timeslots, set grid charge to [[gridcharge]] and generator charge to [[generatorcharge]]. Power limit is [[powerlimit]] and minimum battery charge is [[batterycharge]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| gridcharge | Grid charging | dropdown | - |
| generatorcharge | Generator charging | dropdown | - |
| powerlimit | Power limit | range | - |
| batterycharge | Minimum battery charge | range | - |

